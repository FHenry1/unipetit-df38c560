import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useState } from "react";
import { AuthCard, BrandButton, BrandInput } from "@/components/AuthCard";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPage,
});

function ForgotPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Enviaremos um link de confirmação para o seu e-mail"
      footer={
        <Link to="/" className="font-semibold text-brand">
          Voltar ao login
        </Link>
      }
    >
      {sent ? (
        <p className="rounded-lg bg-brand-soft px-4 py-3 text-center text-sm text-surface-foreground">
          Enviamos um e-mail para <strong>{email}</strong>. Clique no link recebido
          para confirmar que é você e definir uma nova senha.
        </p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            const r = await requestPasswordReset(email);
            setLoading(false);
            if (!r.ok) setError(r.error ?? "Erro");
            else {
              try { sessionStorage.setItem("pwd_reset_email", email); } catch {}
              setSent(true);
            }
          }}
          className="space-y-4"
        >
          <BrandInput
            icon={<Mail size={16} />}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <BrandButton type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link"}
          </BrandButton>
        </form>
      )}
    </AuthCard>
  );
}
