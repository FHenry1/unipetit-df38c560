import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  DoorOpen,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Palette,
  Phone,
  Save,
  Store,
  User as UserIcon,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { OwnerHeader } from "@/components/OwnerHeader";

export const Route = createFileRoute("/_app/owner/profile")({
  component: OwnerProfilePage,
});

function OwnerProfilePage() {
  const { user, logout, exitOwnerMode, mySnackbar, updateProfile, updatePassword, updateMySnackbar } = useAuth();
  const navigate = useNavigate();
  const [exiting, setExiting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  if (!user) return null;

  const onExit = async () => {
    if (exiting) return;
    if (!window.confirm("Voltar ao modo consumidor? Sua lanchonete continua salva.")) return;
    setExiting(true);
    try {
      await exitOwnerMode();
      navigate({ to: "/home" });
    } finally {
      setExiting(false);
    }
  };

  return (
    <div className="pb-8">
      <OwnerHeader title={user.name} subtitle="Vendedor" />

      <div className="-mt-6 space-y-5 px-5">
        {/* Card lanchonete */}
        {mySnackbar && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-center gap-3">
              <div
                className="h-14 w-14 shrink-0 rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url(${mySnackbar.cover})` }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Sua lanchonete</p>
                <h3 className="truncate text-sm font-bold text-white">{mySnackbar.name}</h3>
                <p className="truncate text-xs text-neutral-400">{mySnackbar.location}</p>
              </div>
            </div>
          </div>
        )}

        {mySnackbar && (
          <AppearancePanel snackbar={mySnackbar} onSave={updateMySnackbar} />
        )}


        {/* Edição de perfil */}
        <OwnerProfileForm
          initial={{ name: user.name, phone: user.phone, address: user.address }}
          email={user.email}
          onSave={updateProfile}
        />

        {/* Conta */}
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
          <button
            onClick={() => setShowPwd(true)}
            className="flex w-full items-center justify-between border-b border-neutral-800 px-4 py-3.5 text-left hover:bg-neutral-800/50"
          >
            <span className="flex items-center gap-3 text-sm font-medium text-neutral-100">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#5d0a1a]/40 text-[#e85d75]">
                <KeyRound size={16} />
              </span>
              Trocar senha
            </span>
            <ChevronRight size={16} className="text-neutral-500" />
          </button>

          <button
            onClick={onExit}
            disabled={exiting}
            className="flex w-full items-center justify-between border-b border-neutral-800 px-4 py-3.5 text-left hover:bg-neutral-800/50 disabled:opacity-60"
          >
            <span className="flex items-center gap-3 text-sm font-medium text-amber-400">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/15 text-amber-400">
                {exiting ? <Loader2 size={16} className="animate-spin" /> : <DoorOpen size={16} />}
              </span>
              Voltar ao modo consumidor
            </span>
            <ChevronRight size={16} className="text-neutral-500" />
          </button>

          <button
            onClick={async () => {
              await logout();
              navigate({ to: "/" });
            }}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-neutral-800/50"
          >
            <span className="flex items-center gap-3 text-sm font-medium text-rose-400">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/15 text-rose-400">
                <LogOut size={16} />
              </span>
              Sair da conta
            </span>
            <ChevronRight size={16} className="text-neutral-500" />
          </button>
        </div>

        <p className="px-1 text-center text-[11px] text-neutral-600">
          <Store size={11} className="-mt-0.5 mr-1 inline" />
          UniPetit · Painel do dono
        </p>
      </div>

      {showPwd && <PasswordModal onClose={() => setShowPwd(false)} onSubmit={updatePassword} />}
    </div>
  );
}

function OwnerProfileForm({
  initial,
  email,
  onSave,
}: {
  initial: { name: string; phone?: string | null; address?: string | null };
  email: string;
  onSave: (patch: { name?: string; phone?: string; address?: string }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const dirty =
    name !== initial.name || phone !== (initial.phone ?? "") || address !== (initial.address ?? "");

  const submit = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setMsg(null);
    const res = await onSave({ name, phone, address });
    setSaving(false);
    setMsg(res.ok ? { kind: "ok", text: "Dados atualizados" } : { kind: "err", text: res.error ?? "Erro" });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-400">Meus dados</h3>

      <Field icon={<UserIcon size={14} />} label="Nome">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
          placeholder="Seu nome"
        />
      </Field>

      <Field icon={<Mail size={14} />} label="Email" readOnly>
        <input value={email} disabled className="w-full bg-transparent text-sm text-neutral-500 outline-none" />
      </Field>

      <Field icon={<Phone size={14} />} label="Telefone">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
          placeholder="(00) 00000-0000"
        />
      </Field>

      <Field icon={<MapPin size={14} />} label="Endereço">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
          placeholder="Endereço pessoal"
        />
      </Field>

      {msg && (
        <p className={`text-xs ${msg.kind === "ok" ? "text-emerald-400" : "text-rose-400"}`}>{msg.text}</p>
      )}

      <button
        onClick={submit}
        disabled={!dirty || saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5d0a1a] px-4 py-2.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Salvar alterações
      </button>
    </div>
  );
}

function Field({
  icon,
  label,
  readOnly,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  readOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block rounded-xl border border-neutral-800 px-3 py-2 ${readOnly ? "opacity-70" : "focus-within:border-[#e85d75]"}`}>
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        {icon}
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}

function PasswordModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (pwd.length < 6) return setErr("A senha deve ter ao menos 6 caracteres");
    if (pwd !== confirm) return setErr("As senhas não coincidem");
    setSaving(true);
    const res = await onSubmit(pwd);
    setSaving(false);
    if (!res.ok) return setErr(res.error ?? "Erro");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-white"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Trocar senha</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <input
            type="password"
            placeholder="Nova senha"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-[#e85d75]"
          />
          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm outline-none focus:border-[#e85d75]"
          />
          {err && <p className="text-xs text-rose-400">{err}</p>}
          <button
            onClick={submit}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5d0a1a] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            Atualizar senha
          </button>
        </div>
      </div>
    </div>
  );
}

function AppearancePanel({
  snackbar,
  onSave,
}: {
  snackbar: { accent_color: string; logo_url: string | null; banner_url: string | null };
  onSave: (patch: { accent_color?: string; logo_url?: string | null; banner_url?: string | null }) => Promise<void>;
}) {
  const [accentColor, setAccentColor] = useState(snackbar.accent_color ?? "#e85d75");
  const [logoUrl, setLogoUrl] = useState(snackbar.logo_url ?? "");
  const [bannerUrl, setBannerUrl] = useState(snackbar.banner_url ?? "");
  const [saving, setSaving] = useState(false);
  const presets = ["#e85d75", "#f97316", "#22c55e", "#3b82f6", "#a855f7", "#eab308", "#14b8a6", "#ef4444"];

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-400">
        Aparência da lanchonete
      </h3>

      <div>
        <span className="text-[11px] font-medium text-neutral-400">Cor de destaque</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {presets.map((color) => (
            <button
              key={color}
              onClick={() => setAccentColor(color)}
              style={{ backgroundColor: color }}
              className={`h-8 w-8 rounded-full transition active:scale-90 ${
                accentColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900" : ""
              }`}
              aria-label={color}
            />
          ))}
          <label
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-700 px-3 text-[11px] text-neutral-300 hover:border-neutral-500"
            title="Cor personalizada"
          >
            <Palette size={12} />
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="sr-only"
            />
            {accentColor}
          </label>
        </div>
        <div
          className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: accentColor }}
        >
          <Store size={14} /> Preview do botão de destaque
        </div>
      </div>

      <label className="block">
        <span className="text-[11px] font-medium text-neutral-400">URL do logo (opcional)</span>
        <input
          type="url"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-[#e85d75]"
        />
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="mt-2 h-16 w-16 rounded-xl border border-neutral-700 object-cover" />
        )}
      </label>

      <label className="block">
        <span className="text-[11px] font-medium text-neutral-400">URL do banner (opcional)</span>
        <input
          type="url"
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-[#e85d75]"
        />
        {bannerUrl && (
          <div
            className="mt-2 h-24 w-full rounded-xl border border-neutral-700 bg-cover bg-center"
            style={{ backgroundImage: `url(${bannerUrl})` }}
          />
        )}
      </label>

      <button
        onClick={async () => {
          setSaving(true);
          try {
            await onSave({ accent_color: accentColor, logo_url: logoUrl || null, banner_url: bannerUrl || null });
          } finally {
            setSaving(false);
          }
        }}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5d0a1a] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Salvar aparência
      </button>
    </div>
  );
}
