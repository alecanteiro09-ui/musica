"use client";

import { useEffect, useRef, useState } from "react";
import { HeatmapCanvas } from "./HeatmapCanvas";

/**
 * Iframe somente leitura (mesma origem, pointer-events desligado) da página
 * real, com o mapa de calor de clique desenhado por cima em canvas. O iframe
 * é renderizado no tamanho natural da página (largura/altura médias
 * observadas) e depois escalado via CSS transform pra caber no painel — os
 * cliques em % continuam batendo certo em qualquer escala.
 */
export function HeatmapView({
  path,
  clicks,
  viewport,
}: {
  path: string;
  clicks: { xPct: number; yPct: number }[];
  viewport: { w: number; h: number; docHeight: number };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const containerWidth = containerRef.current?.clientWidth || viewport.w;
      setScale(Math.min(1, containerWidth / viewport.w));
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [viewport.w]);

  const scaledHeight = viewport.docHeight * scale;

  return (
    <div ref={containerRef} className="w-full overflow-hidden rounded-xl border border-base-border" style={{ height: scaledHeight }}>
      <div
        className="relative origin-top-left"
        style={{ width: viewport.w, height: viewport.docHeight, transform: `scale(${scale})` }}
      >
        <iframe
          src={path}
          title={`Prévia de ${path}`}
          scrolling="no"
          style={{ width: viewport.w, height: viewport.docHeight, border: 0, pointerEvents: "none" }}
        />
        <HeatmapCanvas clicks={clicks} width={viewport.w} height={viewport.docHeight} />
      </div>
    </div>
  );
}
