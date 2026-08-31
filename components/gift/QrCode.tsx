"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value, size = 160 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(value, { margin: 1, width: size }).then(setDataUrl);
  }, [value, size]);

  if (!dataUrl) return <div className="rounded-lg bg-base-soft" style={{ width: size, height: size }} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="QR Code" className="rounded-lg bg-white p-2" width={size} height={size} />;
}
