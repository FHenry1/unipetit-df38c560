import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, LogOut, Shield, Star, Trash2, Users, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/admin")({
  component: AdminPage,
});

type AppRow = {
  id: string;
  user_id: string;
  status: string;
  business_name: string;
  notes: string | null;
  created_at: string;
};

type ReviewRow = {
  id: string;
  snackbar_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"applications" | "reviews" | "reports">("applications");

  useEffect(() => {
    if (user && user.role !== "admin") navigate({ to: "/home", replace: true });
  }, [user, navigate]);

  if (!user) return null;
  if (user.role !== "admin") return null;

  const tabs = [
    { id: "applications" as const, label: "Solicitações", icon: Users },
    { id: "reviews" as const, label: "Avaliações", icon: Star },
    { id: "reports" as const, label: "Relatórios", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-5 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#5d0a1a]">
              <Shield size={20} />
            </span>
            <div>
              <h1 className="text-lg font-extrabold">Painel Administrativo</h1>
              <p className="text-xs text-neutral-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={async () => { await logout(); navigate({ to: "/" }); }}
            className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-800 hover:bg-neutral-700"
            aria-label="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-neutral-900 p-1">
          {tabs.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                  active ? "bg-[#5d0a1a] text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="px-5 py-5">
        {tab === "applications" && <ApplicationsTab />}
        {tab === "reviews" && <ReviewsTab />}
        {tab === "reports" && <ReportsTab />}
      </main>
    </div>
  );
}

function ApplicationsTab() {
  const [apps, setApps] = useState<(AppRow & { name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("owner_applications")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as AppRow[];
    let withNames: (AppRow & { name?: string })[] = rows;
    if (rows.length) {
      const { data: profs } = await supabase.rpc("get_public_profiles", {
        _ids: rows.map((r) => r.user_id),
      });
      const map = new Map<string, string>();
      (profs as Array<{ id: string; name: string }> | null)?.forEach((p) => map.set(p.id, p.name));
      withNames = rows.map((r) => ({ ...r, name: map.get(r.user_id) }));
    }
    setApps(withNames);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (userId: string) => {
    setActing(userId);
    await supabase.rpc("admin_approve_owner", { target_user_id: userId });
    await load();
    setActing(null);
  };
  const reject = async (userId: string) => {
    setActing(userId);
    await supabase.rpc("admin_reject_owner", { target_user_id: userId });
    await load();
    setActing(null);
  };

  if (loading) return <p className="text-sm text-neutral-400">Carregando…</p>;
  if (apps.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center text-sm text-neutral-500">
        Nenhuma solicitação pendente.
      </div>
    );

  return (
    <ul className="space-y-3">
      {apps.map((a) => (
        <li key={a.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{a.business_name}</p>
              <p className="text-xs text-neutral-400">Solicitante: {a.name ?? a.user_id.slice(0, 8)}</p>
              {a.notes && <p className="mt-2 text-xs text-neutral-300">{a.notes}</p>}
              <p className="mt-2 text-[10px] uppercase tracking-wider text-neutral-500">
                {new Date(a.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => approve(a.user_id)}
              disabled={acting === a.user_id}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              <Check size={12} /> Aprovar
            </button>
            <button
              onClick={() => reject(a.user_id)}
              disabled={acting === a.user_id}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-neutral-800 px-3 py-2 text-xs font-bold text-neutral-200 hover:bg-neutral-700 disabled:opacity-50"
            >
              <X size={12} /> Rejeitar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("id, snackbar_id, user_id, rating, comment, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setReviews((data ?? []) as ReviewRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    if (!confirm("Excluir esta avaliação?")) return;
    setDeleting(id);
    await supabase.from("reviews").delete().eq("id", id);
    await load();
    setDeleting(null);
  };

  if (loading) return <p className="text-sm text-neutral-400">Carregando…</p>;
  if (reviews.length === 0)
    return <p className="text-sm text-neutral-400">Nenhuma avaliação ainda.</p>;

  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={12}
                    className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-neutral-700"}
                  />
                ))}
                <span className="ml-2 text-[10px] uppercase tracking-wider text-neutral-500">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {r.comment && <p className="mt-2 text-xs text-neutral-200">"{r.comment}"</p>}
              <p className="mt-2 text-[10px] text-neutral-500">
                Usuário: {r.user_id.slice(0, 8)} · Lanchonete: {r.snackbar_id.slice(0, 8)}
              </p>
            </div>
            <button
              onClick={() => onDelete(r.id)}
              disabled={deleting === r.id}
              className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
              aria-label="Excluir"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReportsTab() {
  const [stats, setStats] = useState<{ users: number; snackbars: number; reviews: number; orders: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [u, s, r, o] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("snackbars").select("*", { count: "exact", head: true }),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        users: u.count ?? 0,
        snackbars: s.count ?? 0,
        reviews: r.count ?? 0,
        orders: o.count ?? 0,
      });
    })();
  }, []);

  if (!stats) return <p className="text-sm text-neutral-400">Carregando…</p>;

  const cards = [
    { label: "Usuários", value: stats.users, icon: Users },
    { label: "Lanchonetes", value: stats.snackbars, icon: Shield },
    { label: "Avaliações", value: stats.reviews, icon: Star },
    { label: "Pedidos", value: stats.orders, icon: Check },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5d0a1a]/40 text-[#e85d75]">
                <Icon size={16} />
              </span>
              <span className="text-2xl font-extrabold">{c.value}</span>
            </div>
            <p className="mt-2 text-xs text-neutral-400">{c.label}</p>
          </div>
        );
      })}
    </div>
  );
}
