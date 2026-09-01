# Verso Único

Música personalizada por IA: você conta a história de alguém, recebe a letra e um trecho
cantado de graça, e paga uma vez pra levar a música completa — entregue como uma página-
presente (link + QR Code), não um arquivo solto. Fluxo:

```
Contar a história → Letra grátis (2 refrões) → Editar letra → Gravar música → Ouvir trecho grátis → Pix → Presente liberado
```

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (paleta própria — tinta-índigo + coral quente, ver `tailwind.config.ts`)
- **Supabase** (Postgres + Storage) para pedidos, letras, faixas de áudio e fotos
- **Anthropic (Claude)** para geração de letra — opcional, cai em modo simulado sem chave
- **Mureka API** para geração da música cantada — opcional, cai em modo simulado sem chave
- **Woovi** para cobrança Pix — opcional, cai em modo simulado sem chave
- Lucide Icons, `qrcode`

## Rodando localmente sem nenhuma chave de API

O app funciona 100% em modo simulado — só precisa de um projeto Supabase (mesmo assim, é
só pra ter onde persistir os pedidos; nada de custo além disso):

```bash
npm install
cp .env.example .env.local   # preencha ao menos as 3 variáveis do Supabase
npm run dev
```

Com `LYRICS_PROVIDER`, `MUSIC_PROVIDER` e `PAYMENT_PROVIDER` vazios (ou `mock`), o fluxo
inteiro funciona: letra gerada por template, música substituída por um tom sintetizado em
runtime (`lib/ai/providers/mock-audio.ts` — não é música de verdade, só o bastante pra
testar player/karaokê), e o pagamento se auto-confirma sozinho alguns segundos depois de
gerar o Pix (`lib/payments/mock.ts`), simulando o webhook real.

## Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, rode `supabase/migrations/0001_init.sql` — cria as tabelas (`orders`,
   `order_lyrics`, `order_tracks`, `order_photos`, `payments`), RLS default-deny (só admin
   lê via policy — leitura de comprador/presente passa por token checado em código, nunca
   por RLS pública) e os buckets `photos` (público) e `tracks` (privado).
3. Em **Project Settings → API**, copie `URL`, `anon public key` e `service_role key` pro
   `.env.local`.

## Ligando os provedores reais

Cada integração vive atrás de uma interface (`lib/ai/lyrics.ts`, `lib/ai/music.ts`,
`lib/payments/provider.ts`) com uma implementação mock e uma real — trocar não muda
nenhum call site, só as env vars:

- **Letra**: defina `ANTHROPIC_API_KEY` (`lib/ai/providers/anthropic-lyrics.ts`).
- **Música**: defina `MUSIC_API_KEY` com uma chave da
  [Mureka API](https://platform.mureka.ai) (`lib/ai/providers/real-music.ts`). Escolhida no
  lugar da Eleven Music API por ser "letra-primeiro" (você manda a letra pronta, ela compõe
  melodia + vocal + arranjo em cima) e por ter um custo de entrada menor. Trade-off aceito
  conscientemente: a Kunlun Tech (dona da Mureka) não publica de onde vêm os dados de
  treino do modelo — mesmo tipo de risco de direitos autorais que o Suno tem, só que menor
  porque os termos de revenda aqui são explícitos. **Testado de ponta a ponta contra uma
  conta real** (não é mais só documentação): request de criação, parsing da resposta de
  consulta e download/armazenamento do áudio final, tudo confirmado funcionando.
  - **Preço não é por música** — é por capacidade concorrente. A Mureka cobra por "compra",
    e cada tier trava um número fixo de requisições concorrentes por 12 meses: Trial
    US$10 = 1, Basic US$1.000 = 5, Standard US$3.000 = 15, Business US$5.000 = 25,
    Enterprise US$30.000 = 150 (ver [platform.mureka.ai/pricing](https://platform.mureka.ai/pricing)).
    Com 1 concorrente, as duas faixas de um pedido têm que ser geradas em série de
    verdade — a segunda só começa depois que a primeira chega em `succeeded`, não só
    depois da chamada de criação responder. `generateSong()` inicia só a primeira faixa;
    `getGenerationStatus()` inicia a segunda de forma preguiçosa quando a primeira termina.
    **Antes de ter tráfego real**: no tier Trial, dois clientes comprando ao mesmo tempo
    colidem — contrate um tier com mais concorrência (ou desenhe uma fila) antes de lançar.
- **Pagamento**: crie conta na [Woovi](https://woovi.com), configure `WOOVI_APP_ID` e
  aponte o webhook de confirmação pra `/api/webhooks/woovi`. Confirme na documentação
  atual da Woovi o mecanismo de autenticação do webhook antes de ir pra produção — o
  código em `app/api/webhooks/woovi/route.ts` tem um TODO explícito nesse ponto.

## Estrutura do projeto

```
/app
  page.tsx                landing
  criar/page.tsx           wizard (client)
  pedido/[token]/page.tsx  hub do pedido — renderiza por orders.status
  g/[token]/page.tsx       página-presente pública
  api/webhooks/woovi/      webhook de pagamento (único Route Handler do projeto)
  api/mock-audio/          serve o tom sintetizado do provedor mock de música
/components
  wizard/                  WizardProvider (localStorage) + Wizard + ChoiceGrid
  order/                   ChorusPicker, LyricEditor, GenerationProgress, PreviewAndPaywall, PixCharge, UnlockedSuccess
  gift/                    GiftExperience, AudioPlayer, KaraokeLyrics, PhotoSlideshow, QrCode
  layout/                  Header, Footer
/lib
  supabase/                clientes browser/server/admin
  ai/                      abstrações de letra e música (mock + real)
  payments/                abstração de pagamento (mock + Woovi) + confirmação idempotente
  actions/                 Server Actions (orders, lyrics, payments, photos)
/supabase/migrations/0001_init.sql   schema completo + RLS + buckets
```

## Por que não há checkout de cartão

v1 é **Pix-only**, de propósito: no modelo de negócio em que este produto se inspira, o
Pix embutido via API custa uma taxa fixa muito menor que um checkout hospedado de cartão
(antifraude + parcelamento de terceiro), então faz sentido validar o produto assim antes
de justificar o custo/complexidade de integrar cartão. Ver Roadmap abaixo.

## Roadmap (não implementado nesta entrega)

- **Checkout de cartão de crédito** — via um checkout hospedado (Mercado Pago, Asaas,
  etc.), como caminho alternativo ao Pix para quem prefere cartão/parcelamento.
- **Painel admin** — hoje toda a leitura de pedido é feita com a service role key nas
  Server Actions; um painel de operação (ver pedidos, reprocessar geração, reembolsar)
  ainda não existe.
- **Contratar um tier de mais concorrência na Mureka** (ou construir uma fila) antes de
  lançar — ver ressalva na seção acima sobre o tier Trial (1 requisição concorrente).
- **Expiração de cobrança Pix / limpeza de pedidos abandonados** — hoje um `draft` ou
  `song_generating` nunca expira sozinho.
- **Realtime** em vez de polling para progresso de geração e confirmação de pagamento.
- **Alinhamento palavra-a-palavra de verdade** no karaokê — hoje os timestamps são
  interpolados uniformemente por linha quando o provedor não devolve timing real.
- **Analytics / atribuição de campanha** (UTM, pixel de conversão).
