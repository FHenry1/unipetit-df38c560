import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  
  Heart,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Receipt,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  User as UserIcon,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendente", cls: "bg-amber-100 text-amber-800" },
  preparing: { label: "Preparando", cls: "bg-blue-100 text-blue-800" },
  ready: { label: "Pronto", cls: "bg-emerald-100 text-emerald-800" },
  delivered: { label: "Entregue", cls: "bg-zinc-200 text-zinc-700" },
  cancelled: { label: "Cancelado", cls: "bg-rose-100 text-rose-700" },
};

function ProfilePage() {
  const {
    user,
    logout,
    snackbars,
    reviews,
    updateProfile,
  } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [tab, setTab] = useState<"favorites" | "reviews" | "settings">("favorites");

  // Admin → painel admin
  if (user?.role === "admin") {
    navigate({ to: "/admin", replace: true });
    return null;
  }
  // Owners têm um perfil dedicado em /owner/profile
  if (user?.role === "owner") {
    navigate({ to: "/owner/profile", replace: true });
    return null;
  }

  if (!user) return null;

  const favs = snackbars.filter((s) => user.favorites.includes(s.id));
  const myReviews = reviews.filter((r) => r.user_id === user.id);

  const tabs = [
    { id: "favorites" as const, label: "Favoritos", icon: Heart, count: favs.length },
    { id: "reviews" as const, label: "Avaliações", icon: Star, count: myReviews.length },
    { id: "settings" as const, label: "Ajustes", icon: SettingsIcon, count: null },
  ];

  return (
    <div className="pb-8">
      {/* Hero header */}
      <div className="relative overflow-hidden px-5 pt-10 pb-20">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.12), transparent 60%)",
          }}
        />
        <div className="flex flex-col items-center text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-3xl font-extrabold text-[#5d0a1a] shadow-glow ring-4 ring-white/20">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-white">{user.name}</h1>
          <p className="mt-0.5 text-xs text-white/70">{user.email}</p>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
            <Sparkles size={12} />
            Consumidor
          </span>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatCard icon={<Heart size={16} className="text-rose-500" />} label="Favoritos" value={favs.length} />
          <StatCard icon={<Star size={16} className="text-amber-500" />} label="Avaliações" value={myReviews.length} />
        </div>
      </div>

      <div className="-mt-12 space-y-5 px-5">
        {/* Tabs */}
        <div className="rounded-2xl bg-surface p-1.5 shadow-card">
          <div className="grid grid-cols-3 gap-1">
            {tabs.map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition ${
                    active ? "bg-brand text-white shadow-glow" : "text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                  {t.count !== null && t.count > 0 && (
                    <span className={`ml-0.5 rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white/25 text-white" : "bg-muted text-foreground"}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB: Favoritos */}
        {tab === "favorites" && (
          <section className="space-y-3">
            {favs.length === 0 ? (
              <EmptyCard
                icon={<Heart size={20} className="text-rose-500" />}
                title="Nenhum favorito ainda"
                subtitle="Toque no coração das lanchonetes para salvá-las aqui."
                cta={{ label: "Explorar lanchonetes", to: "/home" }}
              />
            ) : (
              <ul className="space-y-2">
                {favs.map((s) => (
                  <li key={s.id}>
                    <Link
                      to="/snackbar/$id"
                      params={{ id: s.id }}
                      className="flex items-center gap-3 rounded-2xl bg-surface p-3 text-surface-foreground shadow-card transition active:scale-[0.99]"
                    >
                      <div className="h-14 w-14 shrink-0 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${s.cover})` }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="truncate text-sm font-semibold">{s.name}</h4>
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold">
                            <Star size={10} className="fill-current text-amber-500" />
                            {s.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{s.location}</p>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

          </section>
        )}

        {/* TAB: Avaliações */}
        {tab === "reviews" && (
          <section className="space-y-3">
            {myReviews.length === 0 ? (
              <EmptyCard
                icon={<Star size={20} className="text-amber-500" />}
                title="Você ainda não avaliou"
                subtitle="Suas avaliações ajudam outros estudantes a escolher."
                cta={{ label: "Descobrir lanchonetes", to: "/home" }}
              />
            ) : (
              <ul className="space-y-2">
                {myReviews.map((r) => {
                  const sb = snackbars.find((s) => s.id === r.snackbar_id);
                  return (
                    <li key={r.id} className="rounded-2xl bg-surface p-4 text-surface-foreground shadow-card">
                      {sb && (
                        <Link
                          to="/snackbar/$id"
                          params={{ id: sb.id }}
                          className="flex items-center gap-2 text-sm font-semibold hover:text-brand"
                        >
                          <div className="h-8 w-8 shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${sb.cover})` }} />
                          <span className="truncate">{sb.name}</span>
                          <ChevronRight size={14} className="ml-auto text-muted-foreground" />
                        </Link>
                      )}
                      <div className="mt-2 flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={13}
                            className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}
                          />
                        ))}
                        <span className="ml-1 text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="mt-2 text-sm leading-relaxed text-white">"{r.comment}"</p>
                      )}
                      {r.owner_reply && (
                        <div className="mt-3 rounded-xl border-l-2 border-brand bg-brand-soft/50 px-3 py-2">
                          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                            <MessageSquare size={10} /> Resposta do dono
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-white">{r.owner_reply}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* TAB: Configurações */}
        {tab === "settings" && (
          <section className="space-y-4">
            {/* Editar dados */}
            <ProfileForm
              initial={{ name: user.name, phone: user.phone, address: user.address }}
              email={user.email}
              onSave={updateProfile}
            />

            {/* Segurança */}
            <div className="overflow-hidden rounded-2xl bg-surface text-surface-foreground shadow-card">
              <button
                onClick={() => setShowPwd(true)}
                className="flex w-full items-center justify-between border-b border-border px-4 py-3.5 text-left hover:bg-muted/40"
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand"><KeyRound size={16} /></span>
                  Trocar senha
                </span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
              <button
                onClick={async () => {
                  await logout();
                  navigate({ to: "/" });
                }}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/40"
              >
                <span className="flex items-center gap-3 text-sm font-medium text-rose-600">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-100 text-rose-600"><LogOut size={16} /></span>
                  Sair da conta
                </span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            </div>

            {/* Modo proprietário */}
            <div
              className="relative overflow-hidden rounded-2xl p-5 text-white shadow-glow"
              style={{ background: "linear-gradient(135deg,#7a1228 0%,#5d0a1a 55%,#3a0510 100%)" }}
            >
              <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15"><Store size={18} /></span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3a0510]">
                    <TrendingUp size={10} /> Novo
                  </span>
                </div>
                <h3 className="mt-3 text-base font-extrabold">Deseja divulgar sua lanchonete?</h3>
                <p className="mt-1 text-xs leading-relaxed text-white/85">
                  Torne-se dono no UniPetit, cadastre seu menu e alcance novos clientes na universidade.
                </p>
                <button
                  onClick={() => setShowOwnerModal(true)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#5d0a1a] transition active:scale-[0.98]"
                >
                  <Store size={14} />
                  Tornar-se Dono de Lanchonete
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {showPwd && <ChangePasswordModal onClose={() => setShowPwd(false)} />}
      {showOwnerModal && (
        <BecomeOwnerModal userId={user.id} onClose={() => setShowOwnerModal(false)} />
      )}
    </div>
  );
}

function ProfileForm({
  initial,
  email,
  onSave,
}: {
  initial: { name: string; phone: string; address: string };
  email: string;
  onSave: (patch: { name?: string; phone?: string; address?: string }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = useMemo(
    () => name !== initial.name || phone !== initial.phone || address !== initial.address,
    [name, phone, address, initial],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setMsg(null);
    const res = await onSave({ name, phone, address });
    setSaving(false);
    setMsg(res.ok ? { ok: true, text: "Dados atualizados!" } : { ok: false, text: res.error ?? "Erro ao salvar" });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-surface p-4 text-surface-foreground shadow-card">
      <h3 className="mb-3 text-sm font-bold">Meus dados</h3>
      <div className="space-y-3">
        <Field icon={<UserIcon size={14} />} label="Nome">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="input-bare" placeholder="Seu nome" />
        </Field>
        <Field icon={<Mail size={14} />} label="E-mail (não editável)">
          <input value={email} readOnly className="input-bare cursor-not-allowed text-muted-foreground" />
        </Field>
        <Field icon={<Phone size={14} />} label="Telefone">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} inputMode="tel" className="input-bare" placeholder="(11) 99999-0000" />
        </Field>
        <Field icon={<MapPin size={14} />} label="Endereço padrão">
          <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} className="input-bare" placeholder="Rua, número — bairro" />
        </Field>
      </div>
      <button
        type="submit"
        disabled={!dirty || saving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Salvar alterações
      </button>
      {msg && (
        <p className={`mt-2 text-center text-xs font-semibold ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>
      )}
      <style>{`.input-bare{width:100%;background:transparent;outline:none;font-size:14px;font-weight:500;color:#fff}`}</style>
    </form>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-xl border border-border bg-background px-3 py-2">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
        {icon} {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { updatePassword } = useAuth();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pwd.length < 6) return setErr("Mínimo 6 caracteres");
    if (pwd !== confirm) return setErr("As senhas não coincidem");
    setSaving(true);
    const res = await updatePassword(pwd);
    setSaving(false);
    if (!res.ok) return setErr(res.error ?? "Erro");
    setOk(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-surface p-5 text-surface-foreground shadow-2xl sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">Trocar senha</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Nova senha" className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-brand" autoFocus />
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmar nova senha" className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-brand" />
          {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
          {ok && <p className="text-xs font-semibold text-emerald-600">Senha atualizada!</p>}
          <button type="submit" disabled={saving || ok} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
            Atualizar senha
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-surface p-3 text-surface-foreground shadow-card">
      <div className="flex items-center justify-between">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-muted">{icon}</span>
        <span className="text-xl font-extrabold">{value}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyCard({
  icon,
  title,
  subtitle,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta?: { label: string; to: string };
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-5 py-8 text-center text-surface-foreground shadow-card">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-muted">{icon}</span>
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-[28ch] text-xs text-muted-foreground">{subtitle}</p>
      {cta && (
        <Link
          to="/home"
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white shadow-glow transition active:scale-[0.98]"
        >
          {cta.label} <ChevronRight size={12} />
        </Link>
      )}
    </div>
  );
}

function BecomeOwnerModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [businessName, setBusinessName] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("owner_applications")
        .select("status, business_name, document_url, notes")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setStatus((data as any).status);
        setBusinessName((data as any).business_name ?? "");
        setDocumentUrl((data as any).document_url ?? "");
        setNotes((data as any).notes ?? "");
      }
      setLoading(false);
    })();
  }, [userId]);

  const submit = async () => {
    setErr(null);
    if (!businessName.trim()) {
      setErr("Informe o nome do estabelecimento");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("owner_applications").upsert(
      {
        user_id: userId,
        business_name: businessName.trim(),
        document_url: documentUrl.trim() || null,
        notes: notes.trim() || null,
        status: "pending",
      } as any,
      { onConflict: "user_id" },
    );
    setSubmitting(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setSent(true);
    setStatus("pending");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-surface p-5 text-surface-foreground shadow-2xl sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">Tornar-se dono</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : sent || status === "pending" ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-surface-foreground">
              {sent
                ? "Solicitação enviada! Nossa equipe analisará em até 2 dias úteis."
                : "Sua solicitação está em análise."}
            </p>
            <button onClick={onClose} className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white">
              Fechar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Nome do estabelecimento *
              </span>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                maxLength={120}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-brand"
                placeholder="Lanchonete X"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                URL do documento comprobatório
              </span>
              <input
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                maxLength={500}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-brand"
                placeholder="https://..."
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Observação (opcional)
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
                className="mt-1 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-white outline-none focus:border-brand"
              />
            </label>
            {status === "rejected" && (
              <p className="text-xs text-amber-600">
                Sua solicitação anterior foi rejeitada. Você pode reenviar com novos dados.
              </p>
            )}
            {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full rounded-xl bg-brand py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {submitting ? "Enviando…" : "Enviar solicitação"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

