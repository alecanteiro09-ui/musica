import Link from "next/link";
import { Flame, LogOut } from "lucide-react";
import { isAdminAuthed, adminLogout } from "@/lib/actions/admin-auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { getDashboardData } from "@/lib/admin/site-analytics";
import { TrendChart } from "@/components/admin/TrendChart";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
}

export default async function AdminPage() {
  const authed = await isAdminAuthed();
  if (!authed) return <AdminLogin />;

  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-accent">painel interno</p>
          <h1 className="mt-1 font-display text-2xl italic text-ink">Visitantes do site</h1>
        </div>
        <form action={adminLogout}>
          <button type="submit" className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink">
            <LogOut size={14} /> Sair
          </button>
        </form>
      </div>

      <Link
        href="/admin/heatmap"
        className="mt-6 flex items-center gap-2 rounded-xl border border-accent-soft bg-accent-soft/40 px-4 py-3 text-sm font-medium text-accent-dim transition-colors hover:bg-accent-soft"
      >
        <Flame size={16} /> Ver mapa de calor por página
      </Link>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Visitantes hoje" value={data.visitors.today} />
        <StatCard label="Visitantes 7 dias" value={data.visitors.last7d} />
        <StatCard label="Visitantes 30 dias" value={data.visitors.last30d} />
        <StatCard label="Páginas vistas hoje" value={data.pageviews.today} />
        <StatCard label="Páginas vistas 7 dias" value={data.pageviews.last7d} />
        <StatCard label="Tempo médio na página" value={formatDuration(data.avgTimeOnPageMs)} />
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-ink">Visitantes por dia (14 dias)</h2>
        <div className="mt-3 rounded-2xl border border-base-border bg-base-soft p-4">
          <TrendChart data={data.dailyTrend} />
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-ink">Páginas mais vistas</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {data.topPaths.length === 0 && <li className="text-sm text-ink-muted">Sem dados ainda.</li>}
            {data.topPaths.map((p) => (
              <li key={p.path} className="flex items-center justify-between gap-3 rounded-lg border border-base-border bg-base-soft px-3 py-2 text-sm">
                <Link href={`/admin/heatmap?path=${encodeURIComponent(p.path)}`} className="truncate text-ink hover:text-accent">
                  {p.path}
                </Link>
                <span className="shrink-0 text-ink-muted">{p.count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-medium text-ink">De onde vêm</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {data.topReferrers.length === 0 && <li className="text-sm text-ink-muted">Só acesso direto por enquanto.</li>}
            {data.topReferrers.map((r) => (
              <li key={r.host} className="flex items-center justify-between gap-3 rounded-lg border border-base-border bg-base-soft px-3 py-2 text-sm">
                <span className="truncate text-ink">{r.host}</span>
                <span className="shrink-0 text-ink-muted">{r.count}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-6 text-sm font-medium text-ink">Dispositivo</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {data.deviceSplit.map((d) => (
              <li key={d.device} className="flex items-center justify-between gap-3 rounded-lg border border-base-border bg-base-soft px-3 py-2 text-sm">
                <span className="capitalize text-ink">{d.device}</span>
                <span className="shrink-0 text-ink-muted">{d.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-base-border bg-base-soft p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl italic text-ink">{value}</p>
    </div>
  );
}
