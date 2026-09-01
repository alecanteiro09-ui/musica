"use client";

import { useEffect, useRef, useState } from "react";

interface Heart {
  id: number;
  left: number;
  duration: number;
  drift: number;
  scale: number;
  delay: number;
}

/**
 * Corações subindo devagar enquanto a música toca — clima ambiente pra
 * página-presente, só ativo durante a reprodução (não some player nenhum,
 * é decorativo e ignora ponteiro pra não atrapalhar o resto da página).
 */
export function FloatingHearts({ active }: { active: boolean }) {
  const [hearts, setHearts] = useState<Heart[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (!active) return;
    const spawn = () => {
      setHearts((prev) => {
        const next: Heart = {
          id: nextId.current++,
          left: 8 + Math.random() * 84,
          duration: 7 + Math.random() * 5,
          drift: (Math.random() - 0.5) * 60,
          scale: 0.6 + Math.random() * 0.7,
          delay: 0,
        };
        const trimmed = prev.length > 14 ? prev.slice(prev.length - 14) : prev;
        return [...trimmed, next];
      });
    };
    spawn();
    const t = setInterval(spawn, 1400);
    return () => clearInterval(t);
  }, [active]);

  if (hearts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {hearts.map((h) => (
        <span
          key={h.id}
          onAnimationEnd={() => setHearts((prev) => prev.filter((x) => x.id !== h.id))}
          className="absolute bottom-[-40px] text-accent/40"
          style={{
            left: `${h.left}%`,
            fontSize: `${h.scale * 22}px`,
            animation: `float-up ${h.duration}s ease-in ${h.delay}s forwards`,
            ["--drift" as string]: `${h.drift}px`,
          }}
        >
          ♥
        </span>
      ))}
      <style>{`
        @keyframes float-up {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.35; }
          100% { transform: translate(var(--drift), -110vh) rotate(12deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          span { animation-duration: 0.01s !important; }
        }
      `}</style>
    </div>
  );
}
