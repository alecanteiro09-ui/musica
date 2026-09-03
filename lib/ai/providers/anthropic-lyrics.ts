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

/** Garante que a letra tem pelo menos as tags essenciais; se faltar, envolve o texto num [Verse 1]/[Chorus] mínimo. */
function repairTags(content: string): string {
  if (/\[Chorus\]/i.test(content) && /\[Verse/i.test(content)) return content;
  return `[Verse 1]\n${content}`;
}

// Marcas de acento combinantes (ex: o ~ separado do a em "ã" depois de
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
 * no limite da linha (bug real reproduzido 3x em produção com a mesma
 * história de teste, mesmo já com a instrução reforçada duas vezes). Em vez
 * de confiar só no texto do prompt (nem sempre seguido à risca), checa de
 * verdade: se um trecho de 7+ palavras seguidas da letra bate literalmente
 * com um trecho da história/detalhe original, é sinal de cópia longa demais
 * — o chamador pode usar isso pra pedir uma nova geração.
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

export const anthropicLyricsProvider: LyricsProvider = {
  async generateChorusOptions(input: WizardAnswers) {
    const sources = [input.story, input.funDetail];

    async function attempt() {
      const msg = await client().messages.create({
        model: "claude-sonnet-4-5",
        // Era 400 — curto demais depois que a instrução de citar uma frase
        // literal do cliente entrou no SYSTEM_PROMPT: a opção A saiu cortada
        // no meio de uma palavra em teste real ("...sempre er"), porque o
        // texto batia o teto antes do JSON fechar. 700 dá folga confortável
        // pras duas opções de 4 linhas + a citação literal + o wrapper JSON.
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Escreva DUAS opções de refrão (4 linhas cada, sem tags) para uma música ${input.genre} sobre ${input.nickname} (${input.relationship}), ocasião: ${input.occasion}.
História: ${input.story}
Detalhe marcante: ${input.funDetail}
${input.chorusHint ? `Frase que precisa aparecer: "${input.chorusHint}"` : ""}
${input.mood ? `Clima emocional pedido: ${input.mood}.` : ""}
${input.namesToInclude ? `Se fizer sentido, cite também: ${input.namesToInclude}.` : ""}
Responda estritamente como JSON: {"optionA": "...", "optionB": "..."} (linhas separadas por \\n).`,
          },
        ],
      });
      const text = extractText(msg);
      try {
        const parsed = JSON.parse(text);
        return { optionA: String(parsed.optionA), optionB: String(parsed.optionB) };
      } catch {
        const [a, b] = text.split(/\n{2,}/);
        return { optionA: a || text, optionB: b || text };
      }
    }

    const first = await attempt();
    if (!hasLongVerbatimCopy(first.optionA, sources) && !hasLongVerbatimCopy(first.optionB, sources)) return first;
    // Uma tentativa extra basta na prática — não fica retentando indefinidamente.
    return attempt();
  },

  async generateFullLyric(input) {
    async function attempt() {
      const msg = await client().messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1100,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Escreva a letra completa de uma música ${input.genre} sobre ${input.nickname} (${input.relationship}), ocasião: ${input.occasion}, voz: ${input.voicePreference}.
História: ${input.story}
Detalhe marcante: ${input.funDetail}
${input.mood ? `Clima emocional pedido: ${input.mood}.` : ""}
${input.namesToInclude ? `Cite também, onde fizer sentido (ex: na ponte ou no outro): ${input.namesToInclude}.` : ""}
Use este refrão exatamente como o [Chorus] (repita nas duas ocorrências):
${input.chosenChorus}`,
          },
        ],
      });
      return repairTags(extractText(msg));
    }

    const sources = [input.story, input.funDetail];
    const first = await attempt();
    if (!hasLongVerbatimCopy(first, sources)) return first;
    // Uma tentativa extra basta na prática — não fica retentando indefinidamente.
    return attempt();
  },
};
