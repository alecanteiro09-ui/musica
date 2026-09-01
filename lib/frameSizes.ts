/**
 * Tamanhos de quadro oferecidos no upsell de foto em PDF. Separado de
 * lib/pdf/framePdf.ts (que usa pdf-lib) pra poder ser importado por
 * componentes de cliente sem levar pdf-lib pro bundle do browser.
 */
export const FRAME_SIZES = {
  "20x30": { label: "20×30 cm", widthCm: 20, heightCm: 30 },
  "30x40": { label: "30×40 cm", widthCm: 30, heightCm: 40 },
  a4: { label: "A4 (21×29,7 cm)", widthCm: 21, heightCm: 29.7 },
} as const;

export type FrameSizeKey = keyof typeof FRAME_SIZES;

export function isFrameSizeKey(value: string): value is FrameSizeKey {
  return value in FRAME_SIZES;
}
