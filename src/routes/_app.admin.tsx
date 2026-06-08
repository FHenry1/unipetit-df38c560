import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  LogOut,
  MessageSquare,
  Shield,
  ShieldCheck,
  ShieldOff,
  Star,
  Store,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
});

type Tab = "users" | "reviews" | "reports";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

function AdminPage() {
  const { user, snackbars, reviews, logout, refresh, deleteReview } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate({ to: user.role === "owner" ? "/owner" : "/home" });
    }
  }, [user, navigate]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data: profs } = await supabase.from("profiles").select("id, name");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const rolesByUser = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      });
      const list: AdminUser[] = (profs ?? []).map((p: any) => ({
        id: p.id,
        name: p.name ?? "Usuário",
        email: "",
        roles: rolesByUser.get(p.id) ?? ["user"],
      }));
      setUsers(list);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (tab === "users") loadUsers();
  }, [tab]);

  if (!user) return null;
  if (user.role !== "admin") return null;

  const promoteOwner = async (userId: string) => {
    const { error } = await supabase.rpc("admin_approve_owner", { target_user_id: userId });
    if (error) toast.error(error.message);
    else {
      toast.success("Usuário promovido a vendedor");
      await Promise.all([loadUsers(), refresh()]);
    }
  };

  const revokeOwner = async (userId: string) => {
    const { error } = await supabase.rpc("admin_revoke_owner", { target_user_id: userId });
    if (error) toast.error(error.message);
    else {
      toast.success("Permissão de vendedor removida");
      await Promise.all([loadUsers(), refresh()]);
    }
  };

  const removeReview = async (id: string) => {
    if (!window.confirm("Excluir esta avaliação?")) return;
    await deleteReview(id);
    toast.success("Avaliação removida");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-8">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#5d0a1a] to-[#3a0612] px-5 pt-10 pb-10 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Shield size={20} />
            </span>
            <div>
              <h1 className="text-lg font-extrabold">Painel Administrativo</h1>
              <p className="text-xs text-white/70">UniPetit · {user.name}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate({ to: "/" });
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="-mt-6 px-5 space-y-5">
        {/* Tabs */}
        <nav className="grid grid-cols-3 gap-1.5 rounded-2xl bg-neutral-900 p-1.5 border border-neutral-800">
          <AdminTab active={tab === "users"} onClick={() => setTab("users")} icon={<Users size={14} />} label="Usuários" />
          <AdminTab active={tab === "reviews"} onClick={() => setTab("reviews")} icon={<MessageSquare size={14} />} label="Avaliações" />
          <AdminTab active={tab === "reports"} onClick={() => setTab("reports")} icon={<BarChart3 size={14} />} label="Relatórios" />
        </nav>

        {tab === "users" && (
          <UsersTab
            users={users}
            loading={loadingUsers}
            onPromote={promoteOwner}
            onRevoke={revokeOwner}
          />
        )}
        {tab === "reviews" && (
          <ReviewsTab reviews={reviews} snackbars={snackbars} onDelete={removeReview} />
        )}
        {tab === "reports" && <ReportsTab snackbars={snackbars} reviews={reviews} />}
      </div>
    </div>
  );
}

function AdminTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
        active ? "bg-[#5d0a1a] text-white shadow" : "text-neutral-400 hover:text-white"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function UsersTab({
  users,
  loading,
  onPromote,
  onRevoke,
}: {
  users: AdminUser[];
  loading: boolean;
  onPromote: (id: string) => Promise<void>;
  onRevoke: (id: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.id.includes(q));
  }, [users, search]);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-sm font-semibold">Usuários ({users.length})</h2>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome…"
        className="mt-3 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-[#e85d75]"
      />

      {loading ? (
        <p className="py-6 text-center text-xs text-neutral-500">Carregando…</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {filtered.map((u) => {
            const isOwner = u.roles.includes("owner");
            const isAdmin = u.roles.includes("admin");
            return (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{u.name}</p>
                    {isAdmin && (
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                        Admin
                      </span>
                    )}
                    {isOwner && (
                      <span className="rounded-full bg-[#5d0a1a] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                        Vendedor
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[10px] text-neutral-500">{u.id}</p>
                </div>
                {!isAdmin && (
                  isOwner ? (
                    <button
                      onClick={() => onRevoke(u.id)}
                      className="flex items-center gap-1 rounded-lg bg-rose-500/15 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/25"
                    >
                      <ShieldOff size={12} /> Revogar
                    </button>
                  ) : (
                    <button
                      onClick={() => onPromote(u.id)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25"
                    >
                      <ShieldCheck size={12} /> Tornar vendedor
                    </button>
                  )
                )}
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="rounded-xl border border-dashed border-neutral-700 p-4 text-center text-xs text-neutral-500">
              Nenhum usuário encontrado.
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

function ReviewsTab({
  reviews,
  snackbars,
  onDelete,
}: {
  reviews: ReturnType<typeof useAuth>["reviews"];
  snackbars: ReturnType<typeof useAuth>["snackbars"];
  onDelete: (id: string) => Promise<void>;
}) {
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    snackbars.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [snackbars]);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-sm font-semibold">Todas as avaliações ({reviews.length})</h2>
      <ul className="mt-3 space-y-2">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{r.user_name}</p>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={10}
                        className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-neutral-700"}
                      />
                    ))}
                  </div>
                </div>
                <p className="truncate text-[11px] text-neutral-500">
                  em {nameById.get(r.snackbar_id) ?? "—"}
                </p>
                {r.comment && (
                  <p className="mt-1 line-clamp-2 text-xs text-neutral-300">"{r.comment}"</p>
                )}
              </div>
              <button
                onClick={() => onDelete(r.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                aria-label="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
        {reviews.length === 0 && (
          <li className="rounded-xl border border-dashed border-neutral-700 p-4 text-center text-xs text-neutral-500">
            Nenhuma avaliação na plataforma.
          </li>
        )}
      </ul>
    </section>
  );
}

function ReportsTab({
  snackbars,
  reviews,
}: {
  snackbars: ReturnType<typeof useAuth>["snackbars"];
  reviews: ReturnType<typeof useAuth>["reviews"];
}) {
  const totalSnackbars = snackbars.length;
  const totalReviews = reviews.length;
  const totalViews = snackbars.reduce((a, s) => a + (s.view_count || 0), 0);
  const avgRating = snackbars.length
    ? (snackbars.reduce((a, s) => a + s.rating, 0) / snackbars.length).toFixed(1)
    : "—";

  const topSnackbars = [...snackbars]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Store size={16} />} value={String(totalSnackbars)} label="Lanchonetes" />
        <StatCard icon={<MessageSquare size={16} />} value={String(totalReviews)} label="Avaliações" />
        <StatCard icon={<BarChart3 size={16} />} value={String(totalViews)} label="Visualizações" />
        <StatCard icon={<Star size={16} />} value={avgRating} label="Nota média" />
      </div>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-sm font-semibold">Top lanchonetes (por visualizações)</h2>
        <ul className="mt-3 space-y-2">
          {topSnackbars.map((s, idx) => (
            <li key={s.id} className="flex items-center justify-between rounded-xl bg-neutral-950 p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#5d0a1a] text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <p className="text-[11px] text-neutral-500">{s.location}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#e85d75]">{s.view_count} views</span>
            </li>
          ))}
          {topSnackbars.length === 0 && (
            <li className="rounded-xl border border-dashed border-neutral-700 p-4 text-center text-xs text-neutral-500">
              Sem dados ainda.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between text-[#e85d75]">
        {icon}
        <span className="text-2xl font-extrabold text-white">{value}</span>
      </div>
      <p className="mt-1 text-xs text-neutral-400">{label}</p>
    </div>
  );
}
