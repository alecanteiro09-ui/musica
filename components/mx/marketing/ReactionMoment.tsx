/**
 * Equivalente MX de ReactionMoment.tsx (Brasil) — mesmo vídeo de banco
 * (language-agnostic, sem fala), só a legenda traduzida.
 */
export function ReactionMoment() {
  return (
    <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-base-border shadow-card">
      <video
        src="/video/hero-reaction.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="h-48 w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
        <p className="text-xs font-medium text-white">el regalo que se escucha</p>
      </div>
    </div>
  );
}
