import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useState } from "react";
import { AuthCard, BrandButton, BrandInput } from "@/components/AuthCard";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <AuthCard
      title="Recuperar senha"
      subtitle="Digite seu e-mail para receber as instruções"
      footer={
        <Link to="/login" className="font-semibold text-brand">
          Voltar ao login
        </Link>
      }
    >
      {sent ? (
        <p className="rounded-lg bg-brand-soft px-4 py-3 text-center text-sm text-surface-foreground">
          Enviamos um e-mail para <strong>{email}</strong> com as instruções.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
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
          <BrandButton type="submit">Enviar instruções</BrandButton>
        </form>
      )}
    </AuthCard>
  );
}
