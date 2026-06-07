import { createFileRoute } from "@tanstack/react-router";
import { ChefHat, CheckCircle2, Clock, Package, Timer, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { OwnerHeader } from "@/components/OwnerHeader";
import { useAuth, type Order, type OrderStatus } from "@/lib/auth";

export const Route = createFileRoute("/_app/owner/orders")({
  component: OwnerOrders,
});

type Column = Extract<OrderStatus, "pending" | "preparing" | "ready">;

const COLUMNS: { key: Column; label: string; accent: string; icon: React.ReactNode }[] = [
  { key: "pending", label: "Novo", accent: "border-amber-500/40 bg-amber-500/5", icon: <Clock size={14} className="text-amber-400" /> },
  { key: "preparing", label: "Preparando", accent: "border-blue-500/40 bg-blue-500/5", icon: <ChefHat size={14} className="text-blue-400" /> },
  { key: "ready", label: "Pronto", accent: "border-emerald-500/40 bg-emerald-500/5", icon: <Package size={14} className="text-emerald-400" /> },
];

function OwnerOrders() {
  const { mySnackbar, orders, updateOrderStatus } = useAuth();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<Column | null>(null);

  const myOrders = useMemo(
    () => (mySnackbar ? orders.filter((o) => o.snackbar_id === mySnackbar.id) : []),
    [orders, mySnackbar],
  );

  if (!mySnackbar) {
    return <div className="px-5 pt-10 text-sm text-neutral-400">Sem lanchonete.</div>;
  }

  const active = myOrders.filter(
    (o) => o.status === "pending" || o.status === "preparing" || o.status === "ready",
  );
  const closed = myOrders.filter(
    (o) => o.status === "delivered" || o.status === "cancelled",
  );

  const onDrop = (col: Column) => {
    if (!draggingId) return;
    const order = myOrders.find((o) => o.id === draggingId);
    if (order && order.status !== col) {
      updateOrderStatus(draggingId, col);
    }
    setDraggingId(null);
    setDropTarget(null);
  };

  return (
    <div className="pb-6">
      <OwnerHeader title="Pedidos" subtitle={`${active.length} ativos · arraste entre as colunas`} />

      <div className="px-5 -mt-6">
        <div className="grid gap-3 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colOrders = active.filter((o) => o.status === col.key);
            const isTarget = dropTarget === col.key;
            return (
              <section
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dropTarget !== col.key) setDropTarget(col.key);
                }}
                onDragLeave={() => {
                  if (dropTarget === col.key) setDropTarget(null);
                }}
                onDrop={() => onDrop(col.key)}
                className={`rounded-2xl border p-3 transition ${col.accent} ${
                  isTarget ? "ring-2 ring-[#e85d75] scale-[1.01]" : ""
                }`}
              >
                <header className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {col.icon}
                    <h2 className="text-sm font-semibold text-white">{col.label}</h2>
                  </div>
                  <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-neutral-300">
                    {colOrders.length}
                  </span>
                </header>

                <div className="space-y-2 min-h-[60px]">
                  {colOrders.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-800 p-4 text-center text-[11px] text-neutral-600">
                      Solte aqui
                    </div>
                  ) : (
                    colOrders.map((o) => (
                      <KanbanCard
                        key={o.id}
                        order={o}
                        currentColumn={col.key}
                        dragging={draggingId === o.id}
                        onDragStart={() => setDraggingId(o.id)}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setDropTarget(null);
                        }}
                        onAdvance={() => {
                          const next: Record<Column, OrderStatus> = {
                            pending: "preparing",
                            preparing: "ready",
                            ready: "delivered",
                          };
                          updateOrderStatus(o.id, next[col.key]);
                        }}
                        onCancel={() => updateOrderStatus(o.id, "cancelled")}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-white">
            Histórico <span className="text-xs text-neutral-500">· {closed.length}</span>
          </h2>
          {closed.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-800 p-6 text-center text-xs text-neutral-500">
              Sem histórico ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {closed.slice(0, 10).map((o) => (
                <ClosedRow key={o.id} order={o} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function KanbanCard({
  order,
  currentColumn,
  dragging,
  onDragStart,
  onDragEnd,
  onAdvance,
  onCancel,
}: {
  order: Order;
  currentColumn: Column;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onAdvance: () => void;
  onCancel: () => void;
}) {
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group cursor-grab rounded-xl bg-neutral-950 border border-neutral-800 p-3 active:cursor-grabbing transition ${
        dragging ? "opacity-40 scale-95" : "hover:border-neutral-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{order.customer_name}</p>
          <p className="font-mono text-[10px] text-neutral-500">#{order.id.slice(0, 6)}</p>
        </div>
        <Elapsed createdAt={order.created_at} />
      </div>

      {order.notes && (
        <p className="mt-2 truncate text-[11px] italic text-neutral-400">"{order.notes}"</p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-base font-extrabold text-[#e85d75]">
          R$ {order.total.toFixed(2).replace(".", ",")}
        </span>
        <div className="flex gap-1">
          {currentColumn === "pending" && (
            <button
              onClick={onCancel}
              className="rounded-md border border-red-500/30 px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/10"
            >
              Recusar
            </button>
          )}
          <button
            onClick={onAdvance}
            className="rounded-md bg-[#5d0a1a] px-2 py-1 text-[10px] font-semibold text-white hover:bg-[#6e0e22]"
          >
            {currentColumn === "ready" ? "Entregar" : "Avançar →"}
          </button>
        </div>
      </div>
    </article>
  );
}

function Elapsed({ createdAt }: { createdAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const minutes = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60_000));
  const urgent = minutes >= 15;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        urgent
          ? "bg-red-500/15 text-red-400 animate-pulse"
          : "bg-neutral-800 text-neutral-300"
      }`}
    >
      <Timer size={10} />
      {minutes}m
    </span>
  );
}

function ClosedRow({ order }: { order: Order }) {
  const meta =
    order.status === "delivered"
      ? { label: "Entregue", color: "text-emerald-400", icon: <CheckCircle2 size={12} /> }
      : { label: "Cancelado", color: "text-red-400", icon: <XCircle size={12} /> };
  return (
    <div className="flex items-center justify-between rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-white">{order.customer_name}</p>
        <p className={`mt-0.5 flex items-center gap-1 text-[10px] ${meta.color}`}>
          {meta.icon} {meta.label}
        </p>
      </div>
      <span className="text-xs font-bold text-[#e85d75]">
        R$ {order.total.toFixed(2).replace(".", ",")}
      </span>
    </div>
  );
}
