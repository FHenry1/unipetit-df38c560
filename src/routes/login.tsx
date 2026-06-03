import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { AuthCard, BrandButton, BrandInput } from "@/components/AuthCard";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await login(email, password);
    if (!res.ok) {
      setError(res.error ?? "Erro");
      return;
    }
    navigate({ to: "/home" });
  };

  return (
    <AuthCard
      title="Olá de novo!"
      subtitle="Que bom te ver por aqui"
      footer={
        <>
          Não tem conta?{" "}
          <Link to="/signup" className="font-semibold text-brand">
            Cadastrar-se
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
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

        <div className="flex justify-end -mt-1">
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-brand"
          >
            Esqueceu a senha?
          </Link>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <BrandButton type="submit">Acessar</BrandButton>

        <p className="text-center text-[11px] text-muted-foreground">
          Demo: <strong>user@unipetit.com</strong> ou{" "}
          <strong>owner@lanchonete.com</strong> — senha{" "}
          <strong>password123</strong>
        </p>
      </form>
    </AuthCard>
  );
}
