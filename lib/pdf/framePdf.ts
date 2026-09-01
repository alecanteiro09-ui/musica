import { PDFDocument } from "pdf-lib";
import { FRAME_SIZES, type FrameSizeKey } from "../frameSizes";

export { isFrameSizeKey, type FrameSizeKey } from "../frameSizes";

const CM_TO_PT = 28.3464567;

/**
 * Monta um PDF de 1 página, tamanho exato do quadro escolhido, com a foto
 * preenchendo a página inteira (sem bordas — "cover", corta o excedente em
 * vez de distorcer ou sobrar fundo branco).
 */
export async function buildFramedPhotoPdf(imageBytes: Uint8Array, frameSize: FrameSizeKey, isPng: boolean): Promise<Uint8Array> {
  const { widthCm, heightCm } = FRAME_SIZES[frameSize];
  const pageWidth = widthCm * CM_TO_PT;
  const pageHeight = heightCm * CM_TO_PT;

  const doc = await PDFDocument.create();
  const page = doc.addPage([pageWidth, pageHeight]);
  const image = isPng ? await doc.embedPng(imageBytes) : await doc.embedJpg(imageBytes);

  const pageRatio = pageWidth / pageHeight;
  const imageRatio = image.width / image.height;

  let drawWidth: number;
  let drawHeight: number;
  if (imageRatio > pageRatio) {
    drawHeight = pageHeight;
    drawWidth = pageHeight * imageRatio;
  } else {
    drawWidth = pageWidth;
    drawHeight = pageWidth / imageRatio;
  }

  page.drawImage(image, {
    x: (pageWidth - drawWidth) / 2,
    y: (pageHeight - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  });

  return doc.save();
}
