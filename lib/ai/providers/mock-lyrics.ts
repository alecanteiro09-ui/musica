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

/** Equivalente em espanhol dos templates acima — usado quando `input.market === "mx"`. */
function chorusTemplatesEs(nickname: string, detail: string): string[] {
  const d = detail.toLowerCase();
  return [
    [`${nickname}, ${d}`, `eso es lo que te hace quien eres`, `y aunque el tiempo pase tan rápido`, `esta es la parte que quiero guardar`].join("\n"),
    [`Desde el día en que nos encontramos, ${nickname}`, `trajiste una forma nueva de vivir`, `y hoy te canto para recordarte`, `todo lo que hemos ido construyendo`].join("\n"),
    [`Hay tanto que nunca te dije, ${nickname}`, `pero ${d}`, `y eso ya lo dice todo de nosotros`, `esta canción es lo que faltaba`].join("\n"),
    [`${nickname}, si tuviera que elegir un instante`, `elegiría ${d}`, `porque es en esos detalles pequeños`, `donde uno descubre lo que quiere guardar`].join("\n"),
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
    const isMx = input.market === "mx";
    const detail = firstSentence(input.funDetail || input.story || (isMx ? "esa forma que solo tú tienes" : "esse jeito só seu"));
    const [optionA, optionB] = pickTwoDistinct((isMx ? chorusTemplatesEs : chorusTemplates)(input.nickname, detail));
    return { optionA, optionB };
  },

  async generateFullLyric(input) {
    await new Promise((r) => setTimeout(r, 900));
    if (input.market === "mx") {
      const detail = firstSentence(input.funDetail || "esa forma que solo tú tienes");
      const storyLine = firstSentence(input.story || "una historia que vale la pena contar");
      return [
        "[Short Intro - máx 8s]",
        `${input.nickname}, pon atención a esto`,
        "",
        "[Verse 1]",
        `${storyLine}`,
        "y hubo un instante que guardé sin querer",
        `${detail}`,
        "y desde entonces no lo he olvidado",
        "",
        "[Chorus]",
        input.chosenChorus,
        "",
        "[Verse 2]",
        `Todavía pienso en ${detail.toLowerCase()}`,
        `${input.relationship ? "porque así fue como entendí" : "porque así fue como aprendí"}`,
        `${input.relationship ? `lo que es tener a mi ${input.relationship.toLowerCase()}` : "lo que significas para mí"}`,
        "y eso no es cosa pequeña",
        "",
        "[Chorus]",
        input.chosenChorus,
        "",
        "[Bridge]",
        `Hoy es ${input.occasion?.toLowerCase() || "un día diferente"}, pero la verdad es la misma de siempre:`,
        `sigue siendo eso, ¿sabes? ${detail.toLowerCase()}`,
        "es lo que no iba a dejar pasar en blanco",
        "",
        "[Outro]",
        `${input.nickname}, esta canción es tuya`,
        input.namesToInclude ? `y nunca olvidar a ${input.namesToInclude}, tal como son` : "y va a seguir sonando mucho después de terminar",
      ].join("\n");
    }
    // O "detalhe marcante" vira um motivo que volta no verso 2 e na ponte —
    // sem repetição, uma letra genérica de fato não amarra em nada.
    const detail = firstSentence(input.funDetail || "aquele jeito que só você tem");
    const storyLine = firstSentence(input.story || "uma história que vale a pena contar");
    return [
      "[Short Intro - máx 8s]",
      `${input.nickname}, presta atenção nisso aqui`,
      "",
      "[Verse 1]",
      `${storyLine}`,
      "e teve um instante que eu guardei sem querer",
      `${detail}`,
      "e desde ali eu não esqueci mais",
      "",
      "[Chorus]",
      input.chosenChorus,
      "",
      "[Verse 2]",
      `Ainda penso ${detail.toLowerCase().startsWith("em") || detail.toLowerCase().startsWith("no") || detail.toLowerCase().startsWith("na") ? detail.toLowerCase() : `em ${detail.toLowerCase()}`}`,
      `${input.relationship ? `porque foi assim que eu entendi` : "porque foi assim que eu aprendi"}`,
      `${input.relationship ? `o que é ter meu(minha) ${input.relationship.toLowerCase()}` : "o que você é pra mim"}`,
      "e isso não é pouca coisa não",
      "",
      "[Chorus]",
      input.chosenChorus,
      "",
      "[Bridge]",
      `Hoje é ${input.occasion?.toLowerCase() || "um dia diferente"}, mas a verdade é a mesma de sempre:`,
      `continua sendo aquilo, sabe? ${detail.toLowerCase()}`,
      "isso é o que eu não ia deixar passar em branco",
      "",
      "[Outro]",
      `${input.nickname}, essa canção é sua`,
      input.namesToInclude ? `e nunca esquecer ${input.namesToInclude}, do jeitinho que são` : "e vai ficar tocando muito depois de acabar",
    ].join("\n");
  },
};
