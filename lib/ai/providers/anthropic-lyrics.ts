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
- Escolha uma expressão CURTA (2 a 5 palavras, nunca uma frase inteira) tirada literalmente da
  história ou do detalhe marcante — um objeto, um gesto, um lugar (ex: "a sanfona no terreiro",
  "o passo errado") — e encaixe ela naturalmente em algum verso. NUNCA copie uma frase inteira
  do que a pessoa escreveu: isso quebra a métrica e sai cortado ou estranho. É pra ser um
  fragmento pequeno que ancora a letra na vida real dela, não uma citação longa.
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

export const anthropicLyricsProvider: LyricsProvider = {
  async generateChorusOptions(input: WizardAnswers) {
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
  },

  async generateFullLyric(input) {
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
  },
};
