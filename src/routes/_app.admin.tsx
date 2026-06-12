import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Check,
  Inbox,
  LogOut,
  MessageSquare,
  Plus,
  Shield,
  ShieldCheck,
  ShieldOff,
  Star,
  Store,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
});

type Tab = "users" | "applications" | "reviews" | "snackbars" | "reports";

interface OwnerApplication {
  id: string;
  user_id: string;
  business_name: string;
  document_url: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

function AdminPage() {
  const {
    user,
    snackbars,
    reviews,
    logout,
    refresh,
    deleteReview,
    adminDeleteSnackbar,
    adminCreateSnackbar,
  } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [applications, setApplications] = useState<OwnerApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate({ to: user.role === "owner" ? "/owner" : "/home" });
    }
  }, [user, navigate]);

  // Do not render admin UI for non-admins, even momentarily.
  // Server-side RLS still blocks data access, but this avoids any UI flash.
  if (!user || user.role !== "admin") {
    return null;
  }

  const pendingApps = useMemo(
    () => applications.filter((a) => a.status === "pending"),
    [applications],
  );

  const loadApplications = async () => {
    setLoadingApps(true);
    try {
      const { data: apps, error } = await supabase
        .from("owner_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (apps ?? []) as OwnerApplication[];
      const userIds = Array.from(new Set(list.map((a) => a.user_id)));
      if (userIds.length) {
        const { data: profs } = await supabase.rpc("get_public_profiles", { _ids: userIds });
        const nameById = new Map<string, string>(
          (profs ?? []).map((p: any) => [p.id, p.name ?? "Usuário"]),
        );
        list.forEach((a) => {
          a.user_name = nameById.get(a.user_id) ?? "Usuário";
        });
      }
      setApplications(list);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao carregar solicitações");
    } finally {
      setLoadingApps(false);
    }
  };

  // Realtime: notify admin when an owner application is created/updated
  useEffect(() => {
    if (!user || user.role !== "admin") return;
    void loadApplications();
    const channel = supabase
      .channel("owner-applications-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "owner_applications" },
        (payload: any) => {
          void loadApplications();
          if (payload.eventType === "INSERT" && payload.new?.status === "pending") {
            toast.info("Nova solicitação para se tornar dono!", {
              action: { label: "Ver", onClick: () => setTab("applications") },
            });
          } else if (
            payload.eventType === "UPDATE" &&
            payload.old?.status !== "pending" &&
            payload.new?.status === "pending"
          ) {
            toast.info("Solicitação de dono reenviada", {
              action: { label: "Ver", onClick: () => setTab("applications") },
            });
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

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
      await Promise.all([loadUsers(), refresh(), loadApplications()]);
    }
  };

  const rejectApplication = async (userId: string) => {
    const { error } = await supabase.rpc("admin_reject_owner", { target_user_id: userId });
    if (error) toast.error(error.message);
    else {
      toast.success("Solicitação rejeitada");
      await loadApplications();
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

  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  // window.confirm é bloqueado no preview do Lovable (iframe) e em alguns
  // celulares — por isso "nada acontecia". Agora usamos um diálogo próprio.
  const removeReview = async (id: string) => {
    setReviewToDelete(id);
  };

  const confirmRemoveReview = async () => {
    if (!reviewToDelete) return;
    const id = reviewToDelete;
    setReviewToDelete(null);
    try {
      await deleteReview(id);
      toast.success("Avaliação removida");
    } catch {
      /* deleteReview já mostra o toast de erro */
    }
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
            onClick={() => setTab("applications")}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Solicitações pendentes"
          >
            <Bell size={16} />
            {pendingApps.length > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#5d0a1a]">
                {pendingApps.length}
              </span>
            )}
          </button>
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
        <nav className="grid grid-cols-5 gap-1.5 rounded-2xl bg-neutral-900 p-1.5 border border-neutral-800">
          <AdminTab
            active={tab === "users"}
            onClick={() => setTab("users")}
            icon={<Users size={14} />}
            label="Usuários"
          />
          <AdminTab
            active={tab === "applications"}
            onClick={() => setTab("applications")}
            icon={<Inbox size={14} />}
            label="Pedidos"
            badge={pendingApps.length || undefined}
          />
          <AdminTab
            active={tab === "reviews"}
            onClick={() => setTab("reviews")}
            icon={<MessageSquare size={14} />}
            label="Reviews"
          />
          <AdminTab
            active={tab === "snackbars"}
            onClick={() => setTab("snackbars")}
            icon={<Store size={14} />}
            label="Lojas"
          />
          <AdminTab
            active={tab === "reports"}
            onClick={() => setTab("reports")}
            icon={<BarChart3 size={14} />}
            label="Relatos"
          />
        </nav>

        {tab === "applications" && (
          <ApplicationsTab
            applications={applications}
            loading={loadingApps}
            onApprove={promoteOwner}
            onReject={rejectApplication}
            onRefresh={loadApplications}
          />
        )}

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
        {tab === "snackbars" && (
          <SnackbarsTab
            snackbars={snackbars}
            onDelete={adminDeleteSnackbar}
            onCreate={adminCreateSnackbar}
            users={users}
            loadUsers={loadUsers}
          />
        )}
        {tab === "reports" && <ReportsTab snackbars={snackbars} reviews={reviews} />}
      </div>

      <ConfirmDialog
        open={!!reviewToDelete}
        title="Excluir avaliação?"
        description="A avaliação será removida permanentemente. Esta ação não pode ser desfeita."
        onCancel={() => setReviewToDelete(null)}
        onConfirm={confirmRemoveReview}
      />
    </div>
  );
}

function AdminTab({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
        active ? "bg-[#5d0a1a] text-white shadow" : "text-neutral-400 hover:text-white"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge ? (
        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function ApplicationsTab({
  applications,
  loading,
  onApprove,
  onReject,
  onRefresh,
}: {
  applications: OwnerApplication[];
  loading: boolean;
  onApprove: (userId: string) => Promise<void>;
  onReject: (userId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const pending = applications.filter((a) => a.status === "pending");
  const others = applications.filter((a) => a.status !== "pending");
  const statusStyle: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    approved: "bg-emerald-500/20 text-emerald-400",
    rejected: "bg-rose-500/20 text-rose-400",
  };

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          Solicitações para tornar-se dono{" "}
          <span className="text-neutral-500">({applications.length})</span>
        </h2>
        <button
          onClick={onRefresh}
          className="rounded-lg bg-neutral-800 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 hover:bg-neutral-700"
        >
          Atualizar
        </button>
      </div>

      {loading ? (
        <p className="py-6 text-center text-xs text-neutral-500">Carregando…</p>
      ) : applications.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-neutral-700 p-6 text-center text-xs text-neutral-500">
          Nenhuma solicitação ainda. Você receberá uma notificação quando alguém pedir.
        </p>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Pendentes ({pending.length})
              </p>
              <ul className="space-y-2">
                {pending.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border border-amber-500/30 bg-neutral-950 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {a.business_name || "(sem nome)"}
                        </p>
                        <p className="truncate text-[11px] text-neutral-400">
                          por {a.user_name ?? "Usuário"}
                        </p>
                        {a.notes && (
                          <p className="mt-1 line-clamp-2 text-xs text-neutral-400">"{a.notes}"</p>
                        )}
                        {a.document_url && (
                          <a
                            href={a.document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-block text-[11px] font-semibold text-[#e85d75] hover:underline"
                          >
                            Ver documento →
                          </a>
                        )}
                        <p className="mt-1 text-[10px] text-neutral-600">
                          {new Date(a.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => onApprove(a.user_id)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25"
                      >
                        <Check size={12} /> Aprovar
                      </button>
                      <button
                        onClick={() => onReject(a.user_id)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-rose-500/15 px-2.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/25"
                      >
                        <X size={12} /> Rejeitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {others.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Histórico
              </p>
              <ul className="space-y-2">
                {others.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {a.business_name || "(sem nome)"}
                        </p>
                        <p className="truncate text-[11px] text-neutral-500">
                          {a.user_name ?? "Usuário"} ·{" "}
                          {new Date(a.updated_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          statusStyle[a.status] ?? "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
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
                {!isAdmin &&
                  (isOwner ? (
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
                  ))}
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
                        className={
                          n <= r.rating ? "fill-amber-400 text-amber-400" : "text-neutral-700"
                        }
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

  const topSnackbars = [...snackbars].sort((a, b) => b.view_count - a.view_count).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Store size={16} />} value={String(totalSnackbars)} label="Lanchonetes" />
        <StatCard
          icon={<MessageSquare size={16} />}
          value={String(totalReviews)}
          label="Avaliações"
        />
        <StatCard icon={<BarChart3 size={16} />} value={String(totalViews)} label="Visualizações" />
        <StatCard icon={<Star size={16} />} value={avgRating} label="Nota média" />
      </div>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-sm font-semibold">Top lanchonetes (por visualizações)</h2>
        <ul className="mt-3 space-y-2">
          {topSnackbars.map((s, idx) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl bg-neutral-950 p-3"
            >
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

function SnackbarsTab({
  snackbars,
  onDelete,
  onCreate,
  users,
  loadUsers,
}: {
  snackbars: ReturnType<typeof useAuth>["snackbars"];
  onDelete: (id: string) => Promise<void>;
  onCreate: (data: {
    name: string;
    description: string;
    location: string;
    owner_id: string;
    categories: string[];
    opening_time?: string | null;
    closing_time?: string | null;
  }) => Promise<{ ok: boolean; error?: string }>;
  users: AdminUser[];
  loadUsers: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    owner_id: "",
    categories: "",
    opening_time: "",
    closing_time: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (showModal && users.length === 0) void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return snackbars;
    return snackbars.filter(
      (s) => s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q),
    );
  }, [snackbars, search]);

  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDelete = (id: string, name: string) => {
    setToDelete({ id, name });
  };

  const confirmDeleteSnackbar = async () => {
    if (!toDelete) return;
    const { id } = toDelete;
    setToDelete(null);
    setDeleting(id);
    try {
      await onDelete(id);
      toast.success("Lanchonete excluída.");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao excluir.");
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.location.trim() || !form.owner_id) {
      toast.error("Preencha nome, localização e proprietário.");
      return;
    }
    setCreating(true);
    const result = await onCreate({
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      owner_id: form.owner_id,
      categories: form.categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      opening_time: form.opening_time || null,
      closing_time: form.closing_time || null,
    });
    setCreating(false);
    if (result.ok) {
      toast.success("Lanchonete criada!");
      setShowModal(false);
      setForm({
        name: "",
        description: "",
        location: "",
        owner_id: "",
        categories: "",
        opening_time: "",
        closing_time: "",
      });
    } else {
      toast.error(result.error ?? "Erro ao criar.");
    }
  };

  const owners = users.filter((u) => u.roles.includes("owner"));

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Lanchonetes ({filtered.length})</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#5d0a1a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7a1022] transition"
        >
          <Plus size={13} /> Adicionar
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome ou localização…"
        className="mt-3 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-[#e85d75]"
      />

      <ul className="mt-3 space-y-2">
        {filtered.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{s.name}</p>
              <p className="truncate text-[10px] text-neutral-500">{s.location}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                  <Star size={10} className="fill-amber-400" /> {s.rating.toFixed(1)}
                </span>
                <span className="text-[10px] text-neutral-500">{s.view_count} views</span>
                {s.categories.slice(0, 2).map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-neutral-800 px-1.5 py-0.5 text-[9px] text-neutral-400"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleDelete(s.id, s.name)}
              disabled={deleting === s.id}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 disabled:opacity-50"
              aria-label="Excluir lanchonete"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-dashed border-neutral-700 p-4 text-center text-xs text-neutral-500">
            Nenhuma lanchonete encontrada.
          </li>
        )}
      </ul>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-6 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Nova Lanchonete</h3>
              <button
                onClick={() => setShowModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                placeholder="Nome *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-[#e85d75]"
              />
              <textarea
                placeholder="Descrição"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-[#e85d75] resize-none"
              />
              <input
                placeholder="Localização / Endereço *"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-[#e85d75]"
              />
              <select
                value={form.owner_id}
                onChange={(e) => setForm({ ...form, owner_id: e.target.value })}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-[#e85d75]"
              >
                <option value="">Selecionar proprietário (owner) *</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              {owners.length === 0 && (
                <p className="text-[10px] text-amber-400">
                  Nenhum usuário com role "owner" encontrado. Promova um usuário primeiro.
                </p>
              )}
              <input
                placeholder="Categorias (separadas por vírgula)"
                value={form.categories}
                onChange={(e) => setForm({ ...form, categories: e.target.value })}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-[#e85d75]"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] text-neutral-500">Abre às</label>
                  <input
                    type="time"
                    value={form.opening_time}
                    onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-[#e85d75]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-neutral-500">Fecha às</label>
                  <input
                    type="time"
                    value={form.closing_time}
                    onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-[#e85d75]"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating}
              className="mt-4 w-full rounded-xl bg-[#5d0a1a] py-3 text-sm font-bold text-white hover:bg-[#7a1022] disabled:opacity-50 transition"
            >
              {creating ? "Criando…" : "Criar Lanchonete"}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`Excluir "${toDelete?.name ?? ""}"?`}
        description="Todos os dados da lanchonete serão removidos. Esta ação é irreversível."
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDeleteSnackbar}
      />
    </section>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Excluir",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="border-neutral-800 bg-neutral-900 text-neutral-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="uppercase tracking-wide">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-neutral-700 bg-transparent text-xs font-bold uppercase tracking-wide text-neutral-200 hover:bg-neutral-800 hover:text-white">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-rose-600 text-xs font-bold uppercase tracking-wide text-white hover:bg-rose-500"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
