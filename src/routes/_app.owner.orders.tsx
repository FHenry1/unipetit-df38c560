import { createFileRoute } from "@tanstack/react-router";
import { Clock, ChefHat, CheckCircle2, Package, XCircle } from "lucide-react";
import { OwnerHeader } from "@/components/OwnerHeader";
import { useAuth, type OrderStatus } from "@/lib/auth";

export const Route = createFileRoute("/_app/owner/orders")({
  component: OwnerOrders,
});

const STATUS_META: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendente", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: <Clock size={12} /> },
  preparing: { label: "Preparando", color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <ChefHat size={12} /> },
  ready: { label: "Pronto", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: <Package size={12} /> },
  delivered: { label: "Entregue", color: "bg-neutral-700/30 text-neutral-300 border-neutral-700", icon: <CheckCircle2 size={12} /> },
  cancelled: { label: "Cancelado", color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <XCircle size={12} /> },
};

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  pending: "preparing",
  preparing: "ready",
  ready: "delivered",
  delivered: null,
  cancelled: null,
};

function OwnerOrders() {
  const { mySnackbar, orders, updateOrderStatus } = useAuth();

  if (!mySnackbar) {
    return <div className="px-5 pt-10 text-sm text-neutral-400">Sem lanchonete.</div>;
  }

  const myOrders = orders.filter((o) => o.snackbar_id === mySnackbar.id);
  const active = myOrders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const closed = myOrders.filter((o) => o.status === "delivered" || o.status === "cancelled");

  return (
    <div className="pb-6">
      <OwnerHeader title="Pedidos" subtitle={`${active.length} ativos`} />

      <div className="px-5 -mt-6 space-y-5">
        <Section title="Em andamento" count={active.length}>
          {active.length === 0 ? (
            <EmptyState text="Nenhum pedido em andamento." />
          ) : (
            active.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onAdvance={() => {
                  const n = NEXT[o.status];
                  if (n) updateOrderStatus(o.id, n);
                }}
                onCancel={() => updateOrderStatus(o.id, "cancelled")}
              />
            ))
          )}
        </Section>

        <Section title="Histórico" count={closed.length}>
          {closed.length === 0 ? (
            <EmptyState text="Sem histórico ainda." />
          ) : (
            closed.slice(0, 10).map((o) => <OrderCard key={o.id} order={o} />)
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="text-xs text-neutral-500">{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function OrderCard({
  order,
  onAdvance,
  onCancel,
}: {
  order: {
    id: string;
    customer_name: string;
    total: number;
    status: OrderStatus;
    notes: string | null;
    created_at: string;
  };
  onAdvance?: () => void;
  onCancel?: () => void;
}) {
  const meta = STATUS_META[order.status];
  const time = new Date(order.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const next = NEXT[order.status];

  return (
    <article className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{order.customer_name}</p>
          <p className="text-[11px] text-neutral-500">{time}</p>
          {order.notes && (
            <p className="mt-1 text-xs text-neutral-400 italic">"{order.notes}"</p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}
        >
          {meta.icon}
          {meta.label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-extrabold text-[#e85d75]">
          R$ {order.total.toFixed(2).replace(".", ",")}
        </span>
        {onAdvance && next && (
          <div className="flex gap-2">
            {order.status === "pending" && onCancel && (
              <button
                onClick={onCancel}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10"
              >
                Recusar
              </button>
            )}
            <button
              onClick={onAdvance}
              className="rounded-lg bg-[#5d0a1a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6e0e22]"
            >
              {STATUS_META[next].label} →
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-800 p-6 text-center text-xs text-neutral-500">
      {text}
    </div>
  );
}
