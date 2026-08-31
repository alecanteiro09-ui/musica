# Prompt para o Lovable — Verso Único

Cole o texto abaixo no Lovable para começar o projeto.

---

Crie um app web chamado **Verso Único** — "sua história, em canção". É um produto que gera
músicas personalizadas por IA: a pessoa conta a história de alguém que ama, recebe uma letra
grátis, ouve um trecho cantado grátis, e paga uma vez pra levar a música completa como uma
"página-presente" (link + QR Code), não um arquivo solto.

## Identidade visual

- **Paleta** (tema escuro único, sem alternância claro/escuro):
  - Fundo principal `#151221` (tinta-índigo quase preto)
  - Fundo de cards `#1E1A2E`
  - Borda `#332C49`
  - Texto principal `#F3EFE6` (branco quente)
  - Texto secundário `#A79FC0` (lavanda acinzentado)
  - Accent (CTA, destaques) `#FF8A5B` (coral quente) — hover `#E06B3E` — fundo suave `#3D2A22`
  - Cor "wax" (badges/selo) `#F2C14E` (âmbar)
  - Sucesso `#4CD08A`
- **Tipografia**: títulos em **Newsreader** (serif, itálico, elegante — via Google Fonts),
  corpo de texto em **Manrope** (sans). Títulos grandes sempre em itálico.
- **Logo**: um ícone de onda sonora que se curva até parecer um traço de caneta (som
  virando escrita) — traço único em coral (`#FF8A5B`) sobre fundo transparente, ao lado do
  wordmark "Verso Único" em Newsreader itálico. Cantos arredondados em botões (`rounded-full`
  nos CTAs, `rounded-xl`/`rounded-2xl` em cards).
- **Tom visual**: quieto e emocional, não corporativo. Poucos elementos por tela, bastante
  espaço em branco (ou melhor, "espaço em escuro"), nada de gradientes chamativos.

## Estrutura de páginas

### 1. Landing page (`/`)
- Hero: eyebrow "presente que se ouve", título grande itálico "Sua história, em canção.",
  subtítulo curto, botão "Criar minha música — grátis", nota "A letra é grátis. Você decide
  depois de ouvir." **Sem preço nenhum nesta página.**
- Ao lado do hero: um card de demonstração interativa — "UMA MÚSICA PARA Ana" (marcado como
  "exemplo"), botão de play, e uma letra curta que acende palavra por palavra em sincronia
  com um áudio de amostra enquanto toca (efeito karaokê).
- Seção "Como funciona" em 3 passos: 1) Conte a história, 2) Leia a letra de graça,
  3) Envie a canção.
- Seção com 3 cards de motivo: "Feita da sua história", "Você ouve antes de pagar", "Chega
  como presente de verdade".
- CTA final sem preço: "A letra fica pronta na hora, de graça" → botão "Começar agora".

### 2. Wizard de criação (`/criar`)
Fluxo de múltiplos passos, uma pergunta por tela, barra de progresso no topo, botão
"Continuar" que só habilita quando a resposta é válida. Progresso salvo localmente (não
perde o preenchimento se a pessoa recarregar a página). Passos, nesta ordem:

1. **Pra quem é esse presente?** — botões-pílula: Esposa, Marido, Namorada, Namorado, Mãe,
   Pai, Avó, Avô, Filha, Filho, Amiga, Amigo, Outro.
2. **Como você chama essa pessoa?** — campo de texto livre (apelido).
3. **Qual é a ocasião?** — botões-pílula: Aniversário, Declaração de amor, Casamento,
   Saudade de quem partiu, Homenagem, Só porque sim.
4. **Que estilo combina com [nome]?** — botões-pílula: Sertanejo, MPB, Pop, Pagode, Forró,
   Gospel, Bossa nova, Rock.
5. **Quem canta essa música?** — Feminina / Masculina / Dupla.
6. **O que [nome] é pra você?** — textarea livre, com validação de mínimo de caracteres e
   mensagem "escreva um pouco mais — faltam X caracteres" até passar do mínimo.
7. **Conta uma coisa boba sobre [nome]** — textarea livre, mesma validação de mínimo.
8. **Uma frase para o refrão?** — textarea opcional.
9. **Pra onde a gente manda sua letra?** — nome e e-mail.
10. **Tudo certo?** — resumo de tudo que foi respondido, botão final "Escrever minha letra
    grátis".

### 3. Geração da letra e da música (depois do wizard)
- Tela "Qual refrão fica melhor?" — mostra 2 opções de refrão geradas pela IA (com base nas
  respostas do wizard), a pessoa escolhe uma clicando no card.
- Tela "Essa é a sua letra" — a letra completa aparece formatada com tags de seção
  (`[Verse 1]`, `[Chorus]`, `[Bridge]`, `[Outro]` etc.), **editável** num textarea, botão
  "Está pronta — gravar música".
- Tela de progresso — barra de progresso com mensagens que mudam: "Encontrando o tom da sua
  história...", "Dando ritmo às palavras...", "Ajustando os últimos detalhes...".
- Tela de preview — toca um trecho curto (uns 40 segundos) da música, mostra a letra
  completa abaixo, e só aqui aparece o preço, com um botão "Quero a música completa —
  [preço]".

### 4. Pagamento
- Só Pix (não construir cartão de crédito nesta versão). Ao clicar em pagar, gera um QR Code
  Pix e um código "copia e cola", com botão de copiar. Mostra "Aguardando confirmação..."
  com um spinner, e faz polling até o pagamento confirmar — quando confirma, troca de tela
  automaticamente pra tela de sucesso, sem precisar recarregar.

### 5. Sucesso / entrega
- Depois de pago: link e QR Code da página-presente, botão "Abrir o presente", e uma seção
  opcional pra subir até 12 fotos (grade com botão "+").

### 6. Página-presente pública (`/g/:token`)
Essa é a página que a pessoa presenteada recebe (compartilhável, ex. no WhatsApp):
- Nome da pessoa em destaque, título "UMA MÚSICA PARA [nome]".
- Slideshow de fotos com crossfade automático.
- Player de áudio customizado (não usar o player nativo do navegador).
- Letra em efeito karaokê: cada palavra acende na cor accent no momento exato em que é
  cantada, acompanhando o áudio.
- Se houver 2 versões da música, um seletor pra trocar entre elas.
- QR Code da própria página, botão de baixar o MP3.
- Rodapé discreto: "Feito com Verso Único".

## Inteligência artificial

- **Letra**: gerada por um LLM (Claude/Anthropic). O prompt de sistema deve pedir que a
  resposta já venha formatada com tags de seção musical (`[Short Intro]`, `[Verse 1]`,
  `[Chorus]`, `[Verse 2]`, `[Bridge]`, `[Outro]`) e usar os detalhes concretos que a pessoa
  escreveu no wizard (nunca genérico). Primeiro gera só 2 opções de refrão (4 linhas cada);
  só depois de escolhida uma, gera a letra completa "em volta" dela.
- **Música**: gerada por **ElevenLabs Music API** (escolhido por ter API oficial documentada,
  licença comercial inclusa desde o plano mais barato, e caminho de Enterprise pra revenda —
  que é o nosso caso, já que vendemos a música gerada pra terceiros como produto, não só
  usamos pra conteúdo próprio). Envie a letra tagueada + gênero + preferência de voz; o
  resultado é assíncrono — a tela de progresso faz polling até a faixa ficar pronta. Gere
  **2 versões cantadas** por pedido (a pessoa escolhe qual prefere na página-presente).
  Alternativas caso queira comparar depois: Mureka (mais barata, API própria, mas empresa
  menor) — evitar Suno/Udio pra este caso de uso: mesmo em planos pagos, os termos cobrem
  "uso comercial" pessoal, não deixam claro que dá pra revender como produto pra terceiros.
- Estruture a integração atrás de uma função/serviço isolado (ex. `generateSong()`), pra
  trocar de provedor no futuro sem reescrever telas.

## Estrutura de dados (Supabase)

Uma máquina de estados guia tudo: `draft → lyric_generated → song_generating →
preview_ready → paid → delivered` (mais `failed`/`expired` como estados finais de erro).

- **`orders`** — um registro por pedido. Guarda dois tokens diferentes:
  `buyer_token` (privado, é como o comprador retoma o próprio checkout — nunca mostrar pra
  mais ninguém) e `gift_token` (público, só passa a funcionar quando o status vira `paid` ou
  `delivered` — é o token que vai na URL `/g/:token`). Além disso: nome/e-mail do
  comprador, e todas as respostas do wizard (relação, apelido, ocasião, estilo, voz,
  história, detalhe marcante, frase pro refrão), o `status`, e o preço em centavos.
- **`order_lyrics`** — histórico de versões da letra (append-only, nunca sobrescreve): tipo
  `chorus_option` (as 2 opções geradas) ou `full_lyric` (a letra completa, pode ter várias
  versões se a pessoa editar — marcar qual é a atual).
- **`order_tracks`** — as faixas de áudio geradas (2 por pedido, `take_1`/`take_2`), com
  status própria (`queued`/`processing`/`ready`/`failed`), caminho do arquivo de áudio,
  duração, e os tempos de cada palavra (pra sincronizar o karaokê — se o provedor não
  devolver isso, interpolar uniformemente as palavras dentro da duração da linha).
- **`order_photos`** — fotos do presente, até 12 por pedido.
- **`payments`** — cobranças Pix: id de correlação (= id do pedido, evita cobrança
  duplicada), status, QR Code, código copia-e-cola, e o payload cru do webhook recebido (pra
  auditoria).

**Segurança**: não existe login de comprador — o acesso é só pelo token na URL. Por isso,
**não** criar policy pública de leitura nessas tabelas (isso vazaria todos os pedidos pagos
de todo mundo pra qualquer visitante). Toda leitura de comprador/presente deve passar por
uma função de servidor que confere manualmente "esse token bate com esse pedido, e o status
permite mostrar isso?" antes de devolver qualquer dado — nunca confiar em RLS pública pra
essa parte. Só uma policy de admin (via tabela `admin_users`) tem acesso direto.

## Lógica de validação por pergunta

- Passos 1, 3, 4, 5 (escolhas de botão): só habilita "Continuar" com uma opção selecionada.
- Passo 2 (apelido): não pode estar vazio.
- Passos 6 e 7 (textos livres): mínimo de caracteres (sugestão: 20 e 10) — mostrar contador
  regressivo "faltam X caracteres" até passar do mínimo, então trocar pra "Perfeito ✓".
- Passo 8 (frase pro refrão): opcional, sempre libera continuar.
- Passo 9 (contato): nome não-vazio + e-mail em formato válido.
- Passo 10: sempre libera — é só revisão.
- Editor de letra (depois da geração): mínimo de ~20 caracteres antes de liberar "gravar
  música", pra evitar enviar texto vazio pro provedor de música.

## Pagamento — fluxo técnico

1. Ao entrar na tela de preview, criar (ou reaproveitar, se já existir uma pendente) uma
   cobrança Pix via API da Woovi, usando o id do pedido como chave de idempotência
   (`correlationID`), pra nunca gerar duas cobranças pro mesmo pedido.
2. Mostrar o QR Code e o código copia-e-cola devolvidos pela Woovi.
3. Configurar um webhook (endpoint HTTP, não pode ser uma function client-side) que a Woovi
   chama quando o Pix é confirmado — nesse endpoint, validar a autenticidade da chamada
   (conferir a documentação atual da Woovi pro mecanismo exato), achar o pagamento pelo id
   de correlação, marcar como confirmado, e avançar o pedido de `preview_ready` → `paid` →
   `delivered`.
4. Enquanto o QR está na tela, o frontend consulta o status do pedido a cada poucos
   segundos; assim que virar `paid`/`delivered`, troca pra tela de sucesso sozinho, sem a
   pessoa precisar recarregar a página.

## Comportamento geral
- Pagamento único, sem mensalidade — deixar isso claro perto de qualquer menção a preço.
- Garantia simples ("não gostou, devolvemos") perto do botão de pagamento.
- Tudo mobile-first — o produto é compartilhado e aberto principalmente pelo WhatsApp.
- Não inventar números de clientes/depoimentos falsos — se quiser prova social, deixar um
  espaço reservado pra adicionar depoimentos reais depois, não texto genérico fingindo ser
  real.
