import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isAdminAuthed } from "@/lib/actions/admin-auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { getHeatmapData } from "@/lib/admin/site-analytics";
import { HeatmapView } from "@/components/admin/HeatmapView";
import { ScrollDepthBar } from "@/components/admin/ScrollDepthBar";

export const metadata = { title: "Mapa de calor" };
export const dynamic = "force-dynamic";

const DEVICES = [
  { value: "all", label: "Todos" },
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Celular" },
  { value: "tablet", label: "Tablet" },
];

export default async function HeatmapPage({ searchParams }: { searchParams: { path?: string; device?: string } }) {
  const authed = await isAdminAuthed();
  if (!authed) return <AdminLogin />;

  const path = searchParams.path || "/";
  const device = searchParams.device || "all";
  const data = await getHeatmapData(path, device);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/admin" className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <h1 className="mt-3 font-display text-2xl italic text-ink">Mapa de calor</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {data.sampleCount} {data.sampleCount === 1 ? "visita registrada" : "visitas registradas"} nessa página.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <form className="flex items-center gap-2">
          <label className="text-xs text-ink-muted" htmlFor="path-select">
            Página
          </label>
          <select
            id="path-select"
            name="path"
            defaultValue={path}
            className="rounded-lg border border-base-border bg-base-soft px-3 py-1.5 text-sm text-ink"
          >
            {data.paths.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input type="hidden" name="device" value={device} />
          <SubmitOnChange />
        </form>

        <div className="flex gap-1.5">
          {DEVICES.map((d) => (
            <Link
              key={d.value}
              href={`/admin/heatmap?path=${encodeURIComponent(path)}&device=${d.value}`}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                device === d.value ? "border-accent bg-accent text-on-accent" : "border-base-border text-ink-muted hover:border-accent-dim"
              }`}
            >
              {d.label}
            </Link>
          ))}
        </div>
      </div>

      {data.sampleCount === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-base-border py-10 text-center text-sm text-ink-muted">
          Ainda não tem visitas registradas pra essa página/filtro.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_220px]">
          <HeatmapView path={path} clicks={data.clicks} viewport={data.viewport} />
          <div>
            <h2 className="text-sm font-medium text-ink">Onde param e saem</h2>
            <p className="mt-1 text-xs text-ink-muted">% que rolou até ali · tempo parado ali</p>
            <div className="mt-3">
              <ScrollDepthBar bands={data.scrollBands} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Formulário nativo (sem JS) — troca de página via <select> precisa de um pouco de JS pra submeter sozinho. */
function SubmitOnChange() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `document.getElementById('path-select').addEventListener('change', (e) => { e.target.form.submit(); });`,
      }}
    />
  );
}
