import Anthropic from "@anthropic-ai/sdk";
import type { WizardAnswers } from "@/types";
import type { LyricsProvider } from "../lyrics";

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM_PROMPT = `Você escreve letras de música personalizadas em português do Brasil, a partir de
uma história real contada por quem está presenteando outra pessoa. Regras:
- Use os detalhes concretos fornecidos (apelido, história, detalhe marcante) — nunca genérico.
- Nunca invente fatos que não foram contados.
- Tom: sincero, sem clichê piegas.
- Estruture a letra completa com tags de seção exatamente neste formato, cada uma em sua própria linha:
  [Short Intro - máx 8s], [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Outro].
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
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Escreva DUAS opções de refrão (4 linhas cada, sem tags) para uma música ${input.genre} sobre ${input.nickname} (${input.relationship}), ocasião: ${input.occasion}.
História: ${input.story}
Detalhe marcante: ${input.funDetail}
${input.chorusHint ? `Frase que precisa aparecer: "${input.chorusHint}"` : ""}
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
      max_tokens: 900,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Escreva a letra completa de uma música ${input.genre} sobre ${input.nickname} (${input.relationship}), ocasião: ${input.occasion}, voz: ${input.voicePreference}.
História: ${input.story}
Detalhe marcante: ${input.funDetail}
Use este refrão exatamente como o [Chorus] (repita nas duas ocorrências):
${input.chosenChorus}`,
        },
      ],
    });
    return repairTags(extractText(msg));
  },
};
