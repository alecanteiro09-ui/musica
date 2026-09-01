import type { WizardAnswers } from "@/types";
import type { LyricsProvider } from "../lyrics";

function firstSentence(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  const cut = clean.split(/[.!?]/)[0] || clean;
  return cut.length > 60 ? cut.slice(0, 60).trim() : cut;
}

/**
 * Provedor de desenvolvimento: interpola as respostas do wizard num template
 * fixo, sem chamada de rede. Existe para que o fluxo inteiro (wizard → letra
 * → música → pagamento → presente) seja demoável em `npm run dev` sem
 * nenhuma chave de API configurada. Não tenta ser um bom letrista — só
 * plausível o bastante para testar a interface ponta a ponta.
 */
/**
 * Vários templates por refrão — só pra "reescrever com IA" (ver ChorusPicker
 * + regenerateChorusOptions) produzir algo visivelmente diferente mesmo no
 * mock, sem chamada de rede nenhuma. Com Anthropic configurado, a variação
 * vem naturalmente do modelo; aqui é só pra não parecer travado em dev.
 */
function chorusTemplates(nickname: string, detail: string): string[] {
  const d = detail.toLowerCase();
  return [
    [`${nickname}, ${d}`, `é isso que faz de você quem é`, `e por mais que o tempo passe rápido`, `essa é a parte que eu quero guardar`].join("\n"),
    [`Desde o dia em que a gente se encontrou, ${nickname}`, `você trouxe um jeito novo de viver`, `e hoje eu canto pra te lembrar`, `de tudo que a gente já foi construindo`].join("\n"),
    [`Tem tanta coisa que eu nunca disse, ${nickname}`, `mas ${d}`, `e isso já diz tudo sobre nós`, `essa canção é o resto que faltava`].join("\n"),
    [`${nickname}, se eu tivesse que escolher um instante`, `escolhia ${d}`, `porque é nesses detalhes pequenos`, `que a gente descobre o que quer guardar`].join("\n"),
  ];
}

function pickTwoDistinct<T>(items: T[]): [T, T] {
  const a = Math.floor(Math.random() * items.length);
  let b = Math.floor(Math.random() * (items.length - 1));
  if (b >= a) b += 1;
  return [items[a], items[b]];
}

export const mockLyricsProvider: LyricsProvider = {
  async generateChorusOptions(input: WizardAnswers) {
    await new Promise((r) => setTimeout(r, 300));
    const detail = firstSentence(input.funDetail || input.story || "esse jeito só seu");
    const [optionA, optionB] = pickTwoDistinct(chorusTemplates(input.nickname, detail));
    return { optionA, optionB };
  },

  async generateFullLyric(input) {
    await new Promise((r) => setTimeout(r, 900));
    const detail = firstSentence(input.funDetail || "aquele jeito que só você tem");
    const storyLine = firstSentence(input.story || "uma história que vale a pena contar");
    return [
      "[Short Intro - máx 8s]",
      `${input.nickname}, hoje é sobre você`,
      "",
      "[Verse 1]",
      `${storyLine}`,
      `e desde então ficou marcado em mim`,
      `${input.relationship ? `você é meu(minha) ${input.relationship.toLowerCase()}` : "você é parte de quem eu sou"}`,
      "e isso não vai mudar",
      "",
      "[Chorus]",
      input.chosenChorus,
      "",
      "[Verse 2]",
      `${detail}`,
      "é assim que eu sei que é você",
      `mesmo longe, mesmo perto`,
      "é assim que eu quero lembrar",
      "",
      "[Chorus]",
      input.chosenChorus,
      "",
      "[Bridge]",
      `Se hoje é ${input.occasion?.toLowerCase() || "um dia especial"}, que seja claro:`,
      `${input.nickname}, essa canção é sua`,
      "",
      "[Outro]",
      `${input.nickname}, obrigado(a) por tudo`,
      "essa é a nossa canção, pra sempre",
    ].join("\n");
  },
};
