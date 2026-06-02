import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { AuthCard, BrandButton, BrandInput } from "@/components/AuthCard";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("As senhas não coincidem");
    if (password.length < 6) return setError("Senha deve ter ao menos 6 caracteres");
    if (!accepted) return setError("Você precisa aceitar os Termos de Uso");
    const res = signup(name, email, password);
    if (!res.ok) return setError(res.error ?? "Erro");
    navigate({ to: "/home" });
  };

  return (
    <AuthCard
      title="Crie sua conta"
      subtitle="Comece a descobrir lanchonetes"
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-brand">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <BrandInput
          icon={<User size={16} />}
          placeholder="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <BrandInput
          icon={<Mail size={16} />}
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <BrandInput
          icon={<Lock size={16} />}
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <BrandInput
          icon={<Lock size={16} />}
          type="password"
          placeholder="Confirmar senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="h-4 w-4 accent-[color:var(--primary)]"
          />
          Aceito os <span className="text-brand font-semibold">Termos de Uso</span>
        </label>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <BrandButton type="submit">Inscrever-se</BrandButton>
      </form>
    </AuthCard>
  );
}
