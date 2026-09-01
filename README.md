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
- **Suno via Kie.ai** para geração da música cantada — opcional, cai em modo simulado sem chave
- **Woovi** para cobrança Pix — opcional, cai em modo simulado sem chave
- **Resend** para o e-mail de backup do presente liberado — opcional, cai em modo simulado (só loga) sem chave
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
- **Música**: defina `MUSIC_API_KEY` com uma chave da [Kie.ai](https://kie.ai)
  (`lib/ai/providers/real-music.ts`), uma camada não-oficial sobre o Suno.
  **Risco aceito conscientemente**: o Suno em si não tem API comercial pública (só
  anunciou, em jul/2026, um programa de parceiros fechado, sem documentação nem prazo) —
  usar a Kie.ai significa depender de um provedor terceiro sem licença de revenda
  explícita do Suno, sujeito a mudar ou ser cortado sem aviso. A alternativa mais segura
  avaliada foi a Mureka API (termos de revenda explícitos, ainda que sem transparência
  sobre dados de treino) — essa implementação continua disponível no histórico do git
  caso seja necessário voltar atrás. **Testado de ponta a ponta contra uma conta real**:
  request de criação (`POST /api/v1/generate`), polling de status
  (`GET /api/v1/generate/record-info`) e download/armazenamento das 2 faixas de áudio
  geradas, tudo confirmado funcionando — incluindo reprodução real de uma faixa de 114s.
  - **Uma chamada já gera as 2 versões** (`sunoData` na resposta tem 2 itens) — mais
    simples que a Mureka, que exigia gerar as faixas em série por causa de um limite de
    1 requisição concorrente no tier de entrada. Aqui o rate limit é bem mais folgado:
    20 requisições novas / 10s, ~100+ tarefas concorrentes por conta.
  - **`callBackUrl` é obrigatório** no corpo do `POST /generate` (erro 422 sem ele), mesmo
    a documentação não deixando isso claro. Não dependemos do callback de fato — o status
    é obtido por polling — então o valor só precisa existir, não precisa ser alcançável.
  - **Preço**: 12 créditos (~US$0,06) por pedido completo, já com as 2 versões — bem mais
    barato que o modelo de capacidade-concorrente pré-paga da Mureka.
- **Pagamento**: crie conta na [Woovi](https://woovi.com), configure `WOOVI_APP_ID` e
  aponte o webhook de confirmação pra `/api/webhooks/woovi`. Confirme na documentação
  atual da Woovi o mecanismo de autenticação do webhook antes de ir pra produção — o
  código em `app/api/webhooks/woovi/route.ts` tem um TODO explícito nesse ponto.
- **E-mail**: crie conta em [resend.com](https://resend.com), verifique um domínio
  (Domains → Add Domain, adicionar os registros DNS que eles pedem) e defina
  `RESEND_API_KEY` e `EMAIL_FROM` (ex.: `Verso Único <presentes@seudominio.com>`). Sem
  domínio verificado, a conta só consegue mandar pro e-mail do próprio dono — dá pra
  testar assim, mas não serve pra produção. Esse e-mail é só um **backup**: a entrega
  principal já acontece na hora, na tela (`UnlockedSuccess`), pra quem fechar a aba antes
  de salvar o link (`lib/payments/confirm.ts` dispara o envio depois de marcar o pedido
  como `delivered`, sem derrubar a confirmação do pagamento se o envio falhar).

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
  email/                   abstração de e-mail (mock + Resend)
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
- **Substituir a Kie.ai por uma API oficial do Suno** (ou por outro provedor com termos de
  revenda explícitos, como a Mureka) assim que uma estiver disponível — ver ressalva na
  seção acima sobre o risco de depender de uma camada não-oficial.
- **Expiração de cobrança Pix / limpeza de pedidos abandonados** — hoje um `draft` ou
  `song_generating` nunca expira sozinho.
- **Realtime** em vez de polling para progresso de geração e confirmação de pagamento.
- **Alinhamento palavra-a-palavra de verdade** no karaokê — hoje os timestamps são
  interpolados uniformemente por linha quando o provedor não devolve timing real.
- **Analytics / atribuição de campanha** (UTM, pixel de conversão).
