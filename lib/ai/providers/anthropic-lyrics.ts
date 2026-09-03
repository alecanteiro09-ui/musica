import Anthropic from "@anthropic-ai/sdk";
import type { WizardAnswers } from "@/types";
import type { LyricsProvider } from "../lyrics";

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM_PROMPT = `Você é um letrista profissional, do tipo que escreve pra artistas de verdade —
não um gerador de cartão de aniversário. Sua letra é a diferença entre "um presente
personalizado" e "uma música que essa pessoa vai ouvir chorando pelos próximos dez anos".

Como você trabalha:
- De TODOS os detalhes que a pessoa contou, escolha 1 ou 2 imagens concretas e específicas
  (um objeto, um gesto, um cheiro, um lugar, uma frase que alguém costuma dizer) e faça elas
  REAPARECEREM ao longo da letra — no verso 2, na ponte — como um motivo que amarra a música
  inteira. Isso é o que separa uma letra memorável de uma lista de fatos em versos.
- Mostre, não declare. Em vez de "eu te amo muito" ou "você é especial", descreva a CENA que
  prova isso. O sentimento nasce do detalhe concreto, não da afirmação genérica.
- O refrão funciona como uma tese — a frase-resumo de tudo que a música quer dizer. Ele se
  repete, mas cada vez que volta, o verso anterior deu um motivo novo pra ele significar mais.
- Guarde uma virada ou reconhecimento pro fim (uma coisa que só faz sentido dizer depois de
  contar a história toda) — a letra deve ter movimento, não ser uma lista estática de elogios.
- Nunca invente fatos que não foram contados. Se faltar detalhe, trabalhe com o que veio, mas
  não genérico — prefira uma imagem pequena e real a uma frase grande e vazia.
- Escolha uma expressão CURTA (2 a 5 palavras, no máximo) tirada literalmente da história ou do
  detalhe marcante — um objeto, um gesto, um lugar (ex: "a sanfona no terreiro", "o passo
  errado") — e encaixe ela DENTRO de uma linha sua, cercada por palavras suas. Regra dura: a
  PRIMEIRA linha de cada verso NUNCA pode ser a frase da pessoa reescrita ou copiada — comece
  cada verso com uma imagem em SUAS próprias palavras; o fragmento literal entra no meio ou no
  fim de uma linha, nunca abrindo o verso inteiro. Toda linha tem que terminar com a palavra e a
  ideia completas — nunca pare no meio de uma palavra ou de uma frase que não fechou.
- O gênero, a voz escolhida e o clima emocional pedidos não são só metadado: eles têm que se
  ouvir na letra. Vocabulário, imagens e cadência de uma letra de forró não podem soar como as
  de uma balada pop lenta, e vice-versa — escreva pensando em como aquele gênero específico
  fraseia e respira.
- Português do Brasil, tom sincero, zero clichê piegas ("você ilumina meu mundo", "pra sempre
  ao seu lado" e afins são proibidos).
- Estruture a letra completa com tags de seção exatamente neste formato, cada uma em sua
  própria linha: [Short Intro - máx 8s], [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge],
  [Outro].
- Não inclua acordes, apenas letra.`;

function extractText(message: Anthropic.Message): string {
  const block = message.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

/** O modelo às vezes embrulha o JSON pedido em ```json ... ``` (bug real visto em produção: a tela mostrava o bloco cru, cercas incluídas, em vez do refrão). Tira a cerca antes de tentar parsear. */
function stripCodeFence(text: string): string {
  const match = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1] : text;
}

/** Garante que a letra tem pelo menos as tags essenciais; se faltar, envolve o texto num [Verse 1]/[Chorus] mínimo. */
function repairTags(content: string): string {
  if (/\[Chorus\]/i.test(content) && /\[Verse/i.test(content)) return content;
  return `[Verse 1]\n${content}`;
}

// Marcas de acento combinantes (ex: o til separado do "a" em "ã" depois de
// normalize("NFD")) — removidas pra comparar palavras sem depender de acento.
const COMBINING_MARKS = /[̀-ͯ]/g;

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Detecta o modo de falha real que a gente pegou em teste: em vez de citar um
 * fragmento curto (o que o SYSTEM_PROMPT pede), o modelo às vezes tenta colar
 * a frase inteira que a pessoa escreveu e corta no meio da palavra ao bater
 * no limite da linha (bug real reproduzido várias vezes em produção com a
 * mesma história de teste, mesmo já com a instrução reforçada). Em vez de
 * confiar só no texto do prompt (nem sempre seguido à risca), checa de
 * verdade: se um trecho de 7+ palavras seguidas da letra bate literalmente
 * com um trecho da história/detalhe original, é sinal de cópia longa demais
 * — o chamador pode usar isso pra pedir uma correção.
 */
function hasLongVerbatimCopy(generated: string, sources: string[], minRun = 7): boolean {
  const genWords = normalizeWords(generated);
  for (const source of sources) {
    if (!source) continue;
    const srcWords = normalizeWords(source);
    if (srcWords.length < minRun) continue;
    const srcNGrams = new Set<string>();
    for (let i = 0; i + minRun <= srcWords.length; i++) {
      srcNGrams.add(srcWords.slice(i, i + minRun).join(" "));
    }
    for (let i = 0; i + minRun <= genWords.length; i++) {
      if (srcNGrams.has(genWords.slice(i, i + minRun).join(" "))) return true;
    }
  }
  return false;
}

const COPY_CORRECTION =
  'Isso colou um trecho longo da história/detalhe quase palavra por palavra, e uma linha ficou cortada no meio de uma palavra. Reescreva SEM copiar frases inteiras do que a pessoa escreveu — abra cada verso/opção com uma imagem nas SUAS próprias palavras, e use no máximo uma expressão de 2 a 5 palavras da história original. Responda de novo no MESMO formato pedido antes (nada de comentário extra).';

export const anthropicLyricsProvider: LyricsProvider = {
  async generateChorusOptions(input: WizardAnswers) {
    const sources = [input.story, input.funDetail];
    const userPrompt = `Escreva DUAS opções de refrão (4 linhas cada, sem tags) para uma música ${input.genre} sobre ${input.nickname} (${input.relationship}), ocasião: ${input.occasion}.
História: ${input.story}
Detalhe marcante: ${input.funDetail}
${input.chorusHint ? `Frase que precisa aparecer: "${input.chorusHint}"` : ""}
${input.mood ? `Clima emocional pedido: ${input.mood}.` : ""}
${input.namesToInclude ? `Se fizer sentido, cite também: ${input.namesToInclude}.` : ""}
Responda estritamente como JSON puro, sem markdown, sem crase, sem texto antes ou depois: {"optionA": "...", "optionB": "..."} (linhas separadas por \\n).`;

    function parse(text: string) {
      try {
        const parsed = JSON.parse(stripCodeFence(text));
        return { optionA: String(parsed.optionA), optionB: String(parsed.optionB) };
      } catch {
        const [a, b] = text.split(/\n{2,}/);
        return { optionA: a || text, optionB: b || text };
      }
    }

    async function ask(messages: Anthropic.MessageParam[]) {
      const msg = await client().messages.create({
        model: "claude-sonnet-4-5",
        // Era 400 — curto demais depois que a instrução de citar uma frase
        // literal do cliente entrou no SYSTEM_PROMPT: a opção A saiu cortada
        // no meio de uma palavra em teste real ("...sempre er"), porque o
        // texto batia o teto antes do JSON fechar. 700 dá folga confortável
        // pras duas opções de 4 linhas + a citação literal + o wrapper JSON.
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages,
      });
      return parse(extractText(msg));
    }

    const first = await ask([{ role: "user", content: userPrompt }]);
    if (!hasLongVerbatimCopy(first.optionA, sources) && !hasLongVerbatimCopy(first.optionB, sources)) return first;

    // Autocorreção: mostra pro modelo a própria resposta que falhou e pede
    // pra corrigir só isso — na prática é bem mais eficaz que só tentar de
    // novo do zero com o mesmo prompt (testado: uma tentativa "às cegas" às
    // vezes cai na mesma armadilha de novo), porque o modelo vê exatamente
    // o que ele mesmo errou.
    return ask([
      { role: "user", content: userPrompt },
      { role: "assistant", content: JSON.stringify(first) },
      { role: "user", content: COPY_CORRECTION },
    ]);
  },

  async generateFullLyric(input) {
    const sources = [input.story, input.funDetail];
    const userPrompt = `Escreva a letra completa de uma música ${input.genre} sobre ${input.nickname} (${input.relationship}), ocasião: ${input.occasion}, voz: ${input.voicePreference}.
História: ${input.story}
Detalhe marcante: ${input.funDetail}
${input.mood ? `Clima emocional pedido: ${input.mood}.` : ""}
${input.namesToInclude ? `Cite também, onde fizer sentido (ex: na ponte ou no outro): ${input.namesToInclude}.` : ""}
Use este refrão exatamente como o [Chorus] (repita nas duas ocorrências):
${input.chosenChorus}`;

    async function ask(messages: Anthropic.MessageParam[]) {
      const msg = await client().messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1100,
        system: SYSTEM_PROMPT,
        messages,
      });
      return repairTags(stripCodeFence(extractText(msg)));
    }

    const first = await ask([{ role: "user", content: userPrompt }]);
    if (!hasLongVerbatimCopy(first, sources)) return first;

    // Mesma lógica de autocorreção do refrão — ver comentário acima.
    return ask([
      { role: "user", content: userPrompt },
      { role: "assistant", content: first },
      { role: "user", content: COPY_CORRECTION },
    ]);
  },
};
