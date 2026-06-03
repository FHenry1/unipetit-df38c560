import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthCard, BrandButton, BrandInput } from "@/components/AuthCard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { updatePassword, requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const RESEND_DELAY = 30;
  const [cooldown, setCooldown] = useState(RESEND_DELAY);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState<string>(() => {
    try { return sessionStorage.getItem("pwd_reset_email") ?? ""; } catch { return ""; }
  });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("As senhas não coincidem");
    setLoading(true);
    const r = await updatePassword(password);
    setLoading(false);
    if (!r.ok) return setError(r.error ?? "Erro ao redefinir senha");
    setSuccess(true);
    setTimeout(() => navigate({ to: "/home" }), 1500);
  };

  const onResend = async () => {
    if (!resendEmail) return setResendMsg("Informe seu e-mail para reenviar");
    setResending(true);
    setResendMsg(null);
    const r = await requestPasswordReset(resendEmail);
    setResending(false);
    if (!r.ok) setResendMsg(r.error ?? "Erro ao reenviar e-mail");
    else {
      try { sessionStorage.setItem("pwd_reset_email", resendEmail); } catch {}
      setResendMsg("E-mail reenviado! Verifique sua caixa de entrada.");
      setCooldown(RESEND_DELAY);
    }
  };

  return (
    <AuthCard
      title="Nova senha"
      subtitle={
        ready
          ? "Defina sua nova senha de acesso"
          : "Validando link de confirmação..."
      }
    >
      {success ? (
        <p className="rounded-lg bg-brand-soft px-4 py-3 text-center text-sm text-surface-foreground">
          Senha redefinida! Redirecionando...
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <BrandInput
            icon={<Lock size={16} />}
            type="password"
            placeholder="Nova senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!ready}
          />
          <BrandInput
            icon={<Lock size={16} />}
            type="password"
            placeholder="Confirmar nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={!ready}
          />

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <BrandButton type="submit" disabled={!ready || loading}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </BrandButton>

          <div className="space-y-2 border-t border-border/50 pt-4">
            <p className="text-center text-xs text-muted-foreground">
              Não recebeu o e-mail de confirmação?
            </p>
            {!resendEmail && (
              <BrandInput
                type="email"
                placeholder="Seu e-mail"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
            )}
            <button
              type="button"
              onClick={onResend}
              disabled={cooldown > 0 || resending}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-surface-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resending
                ? "Reenviando..."
                : cooldown > 0
                  ? `Reenviar em ${cooldown}s`
                  : "Reenviar e-mail"}
            </button>
            {resendMsg && (
              <p className="text-center text-xs text-muted-foreground">{resendMsg}</p>
            )}
          </div>
        </form>
      )}
    </AuthCard>
  );
}
