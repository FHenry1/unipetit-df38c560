import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, TrendingUp, Receipt, Eye, Star, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { OwnerHeader } from "@/components/OwnerHeader";

export const Route = createFileRoute("/_app/owner")({
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const { user, mySnackbar, orders, reviews, logout } = useAuth();
  const navigate = useNavigate();

  if (!mySnackbar) {
    return (
      <div className="px-5 pt-10 text-sm text-neutral-400">
        Você ainda não é dono.{" "}
        <Link to="/profile" className="text-[#e85d75] underline">
          Tornar-se dono
        </Link>
      </div>
    );
  }

  const myOrders = orders.filter((o) => o.snackbar_id === mySnackbar.id);
  const myReviews = reviews.filter((r) => r.snackbar_id === mySnackbar.id);

  const today = new Date().toDateString();
  const todayOrders = myOrders.filter(
    (o) => new Date(o.created_at).toDateString() === today,
  );
  const salesToday = todayOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((a, o) => a + o.total, 0);
  const pendingCount = myOrders.filter((o) => o.status === "pending").length;

  // Last 7 days sales sparkline
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });
  const series = days.map((day) =>
    myOrders
      .filter(
        (o) =>
          new Date(o.created_at).toDateString() === day && o.status !== "cancelled",
      )
      .reduce((a, o) => a + o.total, 0),
  );
  const maxVal = Math.max(...series, 1);

  return (
    <div className="pb-6">
      <OwnerHeader
        title={mySnackbar.name}
        subtitle="Painel do dono"
        right={
          <button
            onClick={async () => {
              await logout();
              navigate({ to: "/" });
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Sair"
          >
            <LogOut size={16} />
          </button>
        }
      />

      <div className="px-5 -mt-6 space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#5d0a1a] to-[#3a0612] p-5 text-white shadow-[0_20px_50px_-20px_rgba(93,10,26,0.8)]">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            Vendas hoje
          </p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-extrabold">
              R$ {salesToday.toFixed(2).replace(".", ",")}
            </p>
            <TrendingUp className="text-[#e85d75]" size={22} />
          </div>
          <p className="mt-1 text-xs text-white/70">
            {todayOrders.length} pedido(s) recebidos
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric
            icon={<Receipt size={16} />}
            value={String(pendingCount)}
            label="Pedidos pendentes"
            accent
          />
          <Metric
            icon={<Star size={16} />}
            value={mySnackbar.rating ? mySnackbar.rating.toFixed(1) : "—"}
            label="Avaliação média"
          />
          <Metric
            icon={<Eye size={16} />}
            value={String(myReviews.length)}
            label="Avaliações"
          />
          <Metric
            icon={<Receipt size={16} />}
            value={String(myOrders.length)}
            label="Pedidos totais"
          />
        </div>

        {/* Sparkline */}
        <div className="rounded-2xl bg-neutral-900 p-5 border border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Vendas (7 dias)</h3>
              <p className="text-[11px] text-neutral-500">Total por dia</p>
            </div>
            <span className="text-xs font-semibold text-[#e85d75]">
              R$ {series.reduce((a, b) => a + b, 0).toFixed(2).replace(".", ",")}
            </span>
          </div>
          <svg viewBox="0 0 280 80" className="mt-4 h-20 w-full">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e85d75" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#5d0a1a" stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const pts = series.map((v, i) => {
                const x = (i / 6) * 280;
                const y = 70 - (v / maxVal) * 60;
                return [x, y] as const;
              });
              const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
              const area = `${line} L280,80 L0,80 Z`;
              return (
                <>
                  <path d={area} fill="url(#g)" />
                  <path d={line} fill="none" stroke="#e85d75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {pts.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="#5d0a1a" stroke="#e85d75" strokeWidth="1.5" />
                  ))}
                </>
              );
            })()}
          </svg>
        </div>

        <Link
          to="/owner/orders"
          className="flex items-center justify-between rounded-2xl bg-neutral-900 border border-neutral-800 p-4 hover:border-[#5d0a1a] transition"
        >
          <div>
            <p className="text-sm font-semibold text-white">Gerenciar pedidos</p>
            <p className="text-xs text-neutral-500">
              {pendingCount} aguardando atendimento
            </p>
          </div>
          <ArrowRight size={18} className="text-[#e85d75]" />
        </Link>

        <Link
          to="/snackbar/$id"
          params={{ id: mySnackbar.id }}
          className="block rounded-xl border border-neutral-800 py-3 text-center text-sm font-semibold text-neutral-300 hover:bg-neutral-900"
        >
          Ver página pública
        </Link>
      </div>
    </div>
  );
}

function Metric({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 border ${
        accent
          ? "bg-[#5d0a1a]/30 border-[#5d0a1a]"
          : "bg-neutral-900 border-neutral-800"
      }`}
    >
      <div className="flex items-center justify-between text-[#e85d75]">
        {icon}
        <span className="text-2xl font-extrabold text-white">{value}</span>
      </div>
      <p className="mt-1 text-xs text-neutral-400">{label}</p>
    </div>
  );
}
