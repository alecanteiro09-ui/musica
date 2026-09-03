"use client";

import { useEffect, useRef } from "react";

const RADIUS = 32;

/**
 * Desenha os cliques como manchas de calor por cima do iframe da página real
 * — gradiente radial azul→verde→amarelo→vermelho por densidade, técnica
 * clássica de heatmap.js implementada direto em Canvas 2D (sem lib nova).
 */
export function HeatmapCanvas({
  clicks,
  width,
  height,
}: {
  clicks: { xPct: number; yPct: number }[];
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // 1ª passada: soma de intensidade (alpha) em canvas offscreen em tons de cinza.
    const heat = document.createElement("canvas");
    heat.width = width;
    heat.height = height;
    const heatCtx = heat.getContext("2d");
    if (!heatCtx) return;

    for (const click of clicks) {
      const x = (click.xPct / 100) * width;
      const y = (click.yPct / 100) * height;
      const gradient = heatCtx.createRadialGradient(x, y, 0, x, y, RADIUS);
      gradient.addColorStop(0, "rgba(0,0,0,0.35)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      heatCtx.fillStyle = gradient;
      heatCtx.fillRect(x - RADIUS, y - RADIUS, RADIUS * 2, RADIUS * 2);
    }

    // 2ª passada: colore pelo canal alpha usando um LUT azul→verde→amarelo→vermelho.
    const imageData = heatCtx.getImageData(0, 0, width, height);
    const out = ctx.createImageData(width, height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const alpha = imageData.data[i + 3] / 255;
      if (alpha <= 0) continue;
      const [r, g, b] = heatColor(alpha);
      out.data[i] = r;
      out.data[i + 1] = g;
      out.data[i + 2] = b;
      out.data[i + 3] = Math.min(255, alpha * 255 * 1.6);
    }
    ctx.putImageData(out, 0, 0);
  }, [clicks, width, height]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }} />;
}

/** azul → ciano → verde → amarelo → vermelho, conforme a intensidade (0-1). */
function heatColor(t: number): [number, number, number] {
  const stops: [number, number, number, number][] = [
    [0, 33, 102, 172],
    [0.25, 103, 169, 207],
    [0.5, 209, 229, 240],
    [0.65, 253, 219, 199],
    [0.8, 239, 138, 98],
    [1, 178, 24, 43],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, r0, g0, b0] = stops[i];
    const [t1, r1, g1, b1] = stops[i + 1];
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0 || 1);
      return [Math.round(r0 + (r1 - r0) * f), Math.round(g0 + (g1 - g0) * f), Math.round(b0 + (b1 - b0) * f)];
    }
  }
  return [178, 24, 43];
}
