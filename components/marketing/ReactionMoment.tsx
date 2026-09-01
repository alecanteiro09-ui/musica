/**
 * Vídeo ambiente no topo da home — vídeo de banco licenciado (Pexels
 * License: uso comercial livre, sem necessidade de atribuição), não é
 * depoimento de cliente. Por isso a legenda fala do produto ("presente que
 * se ouve"), não afirma ser reação de alguém que comprou — não temos
 * clientes reais pra mostrar ainda, e fingir que sim seria enganoso. Ver
 * public/video/hero-reaction.mp4.
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
        <p className="text-xs font-medium text-white">presente que se ouve</p>
      </div>
    </div>
  );
}
