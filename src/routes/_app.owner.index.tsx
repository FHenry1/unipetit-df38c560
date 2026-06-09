import { createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Eye,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  MessageSquare,
  Pencil,
  Star,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth, type SnackBar } from "@/lib/auth";
import { OwnerHeader } from "@/components/OwnerHeader";

export const Route = createFileRoute("/_app/owner/")({
  component: OwnerDashboard,
});

function OwnerDashboard() {
  const { mySnackbar, reviews, logout, updateMySnackbar } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [editing, setEditing] = useState(false);

  const myReviews = useMemo(
    () => (mySnackbar ? reviews.filter((r) => r.snackbar_id === mySnackbar.id) : []),
    [reviews, mySnackbar],
  );

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

  const newReviews = myReviews.filter((r) => !r.owner_seen).length;

  return (
    <div className="pb-8">
      <OwnerHeader
        title={mySnackbar.name}
        subtitle="Painel do vendedor"
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
        <nav className="grid grid-cols-2 gap-1.5 rounded-2xl bg-neutral-900 p-1.5 border border-neutral-800">
          <TabLink to="/owner" active={pathname === "/owner"} icon={<LayoutDashboard size={14} />} label="Resumo" />
          <TabLink to="/owner/reviews" active={pathname.startsWith("/owner/reviews")} icon={<MessageSquare size={14} />} label="Reviews" badge={newReviews} />
        </nav>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3">
          <Metric icon={<Eye size={16} />} value={String(mySnackbar.view_count)} label="Visualizações" />
          <Metric icon={<Star size={16} />} value={mySnackbar.rating ? mySnackbar.rating.toFixed(1) : "—"} label="Avaliação" />
          <Metric icon={<MessageSquare size={16} />} value={String(newReviews)} label="Reviews novas" accent />
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            icon={<UtensilsCrossed size={18} />}
            label="Gerenciar cardápio"
            sub={`${mySnackbar.menu_items.length} itens`}
            onClick={() => navigate({ to: "/owner/menu" })}
          />
          <QuickAction
            icon={<Pencil size={18} />}
            label="Atualizar informações"
            sub="Nome, endereço, capa"
            onClick={() => setEditing(true)}
          />
        </div>

        {/* Avaliações recentes */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Avaliações recentes</h3>
              <p className="text-[11px] text-neutral-500">Últimas avaliações dos clientes</p>
            </div>
            <Link to="/owner/reviews" className="text-[11px] font-semibold text-[#e85d75] hover:underline">
              Ver todas
            </Link>
          </div>
          {myReviews.length === 0 ? (
            <p className="py-4 text-center text-xs text-neutral-500">Nenhuma avaliação ainda.</p>
          ) : (
            <ul className="space-y-3">
              {myReviews
                .slice()
                .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
                .slice(0, 3)
                .map((r) => (
                  <li key={r.id} className="rounded-xl border border-neutral-800/60 bg-neutral-950/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-neutral-200">{r.user_name}</p>
                      <div className="flex shrink-0 items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={11}
                            className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-neutral-700"}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-neutral-400">"{r.comment}"</p>
                    )}
                    <p className="mt-1.5 text-[10px] text-neutral-600">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <Link
          to="/snackbar/$id"
          params={{ id: mySnackbar.id }}
          className="block rounded-xl border border-neutral-800 py-3 text-center text-sm font-semibold text-neutral-300 hover:bg-neutral-900"
        >
          Ver página pública
        </Link>
      </div>

      {editing && (
        <EditSnackbarModal
          snackbar={mySnackbar}
          onClose={() => setEditing(false)}
          onSave={async (patch) => {
            await updateMySnackbar(patch);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function QuickAction({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-1 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-left transition hover:border-[#5d0a1a] hover:bg-neutral-900/80"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#5d0a1a] text-[#e85d75] group-hover:bg-[#7a1228] group-hover:text-white">
        {icon}
      </span>
      <p className="mt-1 text-sm font-bold text-white">{label}</p>
      <p className="text-[11px] text-neutral-500">{sub}</p>
    </button>
  );
}

function EditSnackbarModal({
  snackbar,
  onClose,
  onSave,
}: {
  snackbar: SnackBar;
  onClose: () => void;
  onSave: (patch: Partial<SnackBar>) => Promise<void>;
}) {
  const [name, setName] = useState(snackbar.name);
  const [description, setDescription] = useState(snackbar.description);
  const [location, setLocation] = useState(snackbar.location);
  const [cover, setCover] = useState(snackbar.cover);
  const [openingTime, setOpeningTime] = useState(snackbar.opening_time ?? "");
  const [closingTime, setClosingTime] = useState(snackbar.closing_time ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave({
        name,
        description,
        location,
        cover,
        opening_time: openingTime || null,
        closing_time: closingTime || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 text-white"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-3">
          <h3 className="text-sm font-bold">Atualizar informações</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 p-5 max-h-[70vh] overflow-y-auto">
          <ModalField label="Nome">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-[#e85d75]"
            />
          </ModalField>
          <ModalField label="Descrição">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-[#e85d75]"
            />
          </ModalField>
          <ModalField label="Endereço" icon={<MapPin size={12} />}>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-[#e85d75]"
            />
          </ModalField>
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Abre às">
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-[#e85d75]"
              />
            </ModalField>
            <ModalField label="Fecha às">
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-[#e85d75]"
              />
            </ModalField>
          </div>
          <ModalField label="URL da capa">
            <input
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-[#e85d75]"
            />
            {cover && (
              <div
                className="mt-2 h-24 w-full rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url(${cover})` }}
              />
            )}
          </ModalField>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-neutral-800 px-4 py-2.5 text-sm font-semibold text-neutral-300 hover:bg-neutral-800/50"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={saving || !name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5d0a1a] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        {icon}
        {label}
      </p>
      {children}
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
  to: "/owner" | "/owner/reviews";
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
