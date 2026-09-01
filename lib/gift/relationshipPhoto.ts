/**
 * Mapeia o texto livre de "relationship" (vem do wizard, ver RELATIONSHIPS em
 * components/wizard/Wizard.tsx) pra uma das fotos já licenciadas em
 * /public/images/occasions (Pexels License, uso comercial livre — ver
 * comentário em components/marketing/RelationshipGallery.tsx). Usada como
 * fallback em preto e branco na página-presente quando o cliente não sobe
 * foto própria.
 */
const RELATIONSHIP_PHOTO: Record<string, string> = {
  pai: "pai",
  mãe: "mae",
  mae: "mae",
  avó: "avos",
  avô: "avos",
  avós: "avos",
  filha: "filhos",
  filho: "filhos",
  namorada: "namorados",
  namorado: "namorados",
  esposa: "esposa",
  marido: "marido",
  amiga: "amiga",
  amigo: "amiga",
};

export function relationshipPhoto(relationship: string): string {
  const key = relationship.trim().toLowerCase();
  const file = RELATIONSHIP_PHOTO[key] ?? "amiga";
  return `/images/occasions/${file}.jpg`;
}
