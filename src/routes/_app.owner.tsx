import { createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  DollarSign,
  Eye,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  MessageSquare,
  Pencil,
  Receipt,
  Star,
  TrendingUp,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth, type SnackBar } from "@/lib/auth";
import { OwnerHeader } from "@/components/OwnerHeader";

export const Route = createFileRoute("/_app/owner")({
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const { mySnackbar, orders, reviews, logout, updateMySnackbar } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [editing, setEditing] = useState(false);

  const myOrders = useMemo(
    () => (mySnackbar ? orders.filter((o) => o.snackbar_id === mySnackbar.id) : []),
    [orders, mySnackbar],
  );
  const myReviews = useMemo(
    () => (mySnackbar ? reviews.filter((r) => r.snackbar_id === mySnackbar.id) : []),
    [reviews, mySnackbar],
  );

  // Last 7 days
  const salesSeries = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toDateString();
      const dayOrders = myOrders.filter(
        (o) =>
          new Date(o.created_at).toDateString() === key &&
          o.status !== "cancelled",
      );
      return {
        day: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        total: dayOrders.reduce((a, o) => a + o.total, 0),
        pedidos: dayOrders.length,
      };
    });
  }, [myOrders]);

  // Top categories (by menu items count per category)
  const categoryData = useMemo(() => {
    if (!mySnackbar) return [];
    const counts: Record<string, number> = {};
    mySnackbar.categories.forEach((c) => (counts[c] = 0));
    mySnackbar.menu_items.forEach((i) => {
      mySnackbar.categories.forEach((c) => {
        if (i.name.toLowerCase().includes(c.toLowerCase())) counts[c] = (counts[c] ?? 0) + 1;
      });
    });
    const list = Object.entries(counts).map(([name, value]) => ({ name, value }));
    return list.length ? list : [{ name: "Itens", value: mySnackbar.menu_items.length }];
  }, [mySnackbar]);

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

  const today = new Date().toDateString();
  const todayOrders = myOrders.filter(
    (o) => new Date(o.created_at).toDateString() === today,
  );
  const salesToday = todayOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((a, o) => a + o.total, 0);
  const pendingCount = myOrders.filter((o) => o.status === "pending").length;
  const newReviews = myReviews.filter((r) => !r.owner_seen).length;

  const totalWeek = salesSeries.reduce((a, b) => a + b.total, 0);

  return (
    <div className="pb-8">
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

      <div className="-mt-6 space-y-5 px-5">
        {/* Tabs */}
        <nav className="grid grid-cols-4 gap-1.5 rounded-2xl bg-neutral-900 p-1.5 border border-neutral-800">
          <TabLink to="/owner" active={pathname === "/owner"} icon={<LayoutDashboard size={14} />} label="Resumo" />
          <TabLink to="/owner/orders" active={pathname.startsWith("/owner/orders")} icon={<Receipt size={14} />} label="Pedidos" badge={pendingCount} />
          <TabLink to="/owner/menu" active={pathname.startsWith("/owner/menu")} icon={<UtensilsCrossed size={14} />} label="Menu" />
          <TabLink to="/owner/reviews" active={pathname.startsWith("/owner/reviews")} icon={<MessageSquare size={14} />} label="Reviews" badge={newReviews} />
        </nav>

        {/* Hero card vendas */}
        <div className="rounded-2xl bg-gradient-to-br from-[#5d0a1a] to-[#3a0612] p-5 text-white shadow-[0_20px_50px_-20px_rgba(93,10,26,0.8)]">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Vendas hoje</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-extrabold">R$ {salesToday.toFixed(2).replace(".", ",")}</p>
            <TrendingUp className="text-[#e85d75]" size={22} />
          </div>
          <p className="mt-1 text-xs text-white/70">{todayOrders.length} pedido(s) recebidos</p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3">
          <Metric icon={<Receipt size={16} />} value={String(pendingCount)} label="Pendentes" accent />
          <Metric icon={<Star size={16} />} value={mySnackbar.rating ? mySnackbar.rating.toFixed(1) : "—"} label="Avaliação média" />
          <Metric icon={<DollarSign size={16} />} value={`R$ ${totalWeek.toFixed(0)}`} label="Receita 7 dias" />
          <Metric icon={<Eye size={16} />} value={String(newReviews)} label="Reviews novas" />
        </div>

        {/* Sales chart */}
        <ChartCard title="Vendas (7 dias)" subtitle={`Total R$ ${totalWeek.toFixed(2).replace(".", ",")}`}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={salesSeries} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e85d75" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#5d0a1a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="day" stroke="#777" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#777" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Vendas"]}
              />
              <Area type="monotone" dataKey="total" stroke="#e85d75" strokeWidth={2.5} fill="url(#gSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Orders count */}
        <ChartCard title="Pedidos por dia" subtitle="Últimos 7 dias">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={salesSeries} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="day" stroke="#777" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#777" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => [String(v), "Pedidos"]}
              />
              <Bar dataKey="pedidos" fill="#e85d75" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Categories chart */}
        <ChartCard title="Categorias do menu" subtitle="Itens cadastrados por categoria">
          <ResponsiveContainer width="100%" height={Math.max(120, categoryData.length * 36)}>
            <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
              <XAxis type="number" stroke="#777" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="name" type="category" stroke="#aaa" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip
                contentStyle={{ background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="value" fill="#7a1228" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Quick links */}
        <Link
          to="/owner/orders"
          className="flex items-center justify-between rounded-2xl bg-neutral-900 border border-neutral-800 p-4 hover:border-[#5d0a1a] transition"
        >
          <div>
            <p className="text-sm font-semibold text-white">Gerenciar pedidos</p>
            <p className="text-xs text-neutral-500">{pendingCount} aguardando atendimento</p>
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

function TabLink({
  to,
  active,
  icon,
  label,
  badge,
}: {
  to: "/owner" | "/owner/orders" | "/owner/menu" | "/owner/reviews";
  active: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      to={to}
      className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
        active ? "bg-[#5d0a1a] text-white shadow" : "text-neutral-400 hover:text-white"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge ? (
        <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e85d75] px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
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
        accent ? "bg-[#5d0a1a]/30 border-[#5d0a1a]" : "bg-neutral-900 border-neutral-800"
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

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-[11px] text-neutral-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
