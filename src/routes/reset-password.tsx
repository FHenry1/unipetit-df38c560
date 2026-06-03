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
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash automatically
    // and emits a PASSWORD_RECOVERY event.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

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
        </form>
      )}
    </AuthCard>
  );
}
