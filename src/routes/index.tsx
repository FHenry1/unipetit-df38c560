import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import logoAsset from "@/assets/unipetit-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: Landing,
});

type Screen = "selection" | "login" | "signup" | "forgot";

function Landing() {
  const { user, login, signup, requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("selection");
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: user.role === "owner" ? "/owner" : "/home" });
  }, [user, navigate]);

  const handleTrigger = () => {
    if (triggered) return;
    setTriggered(true);
    setTimeout(() => setModalOpen(true), 80);
  };

  return (
    <main
      onClick={handleTrigger}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#5d0a1a] select-none"
      style={{ cursor: triggered ? "default" : "pointer" }}
    >
      <div
        className="absolute left-0 right-0 z-10 flex flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{
          top: modalOpen ? "1.5vh" : "50%",
          transform: modalOpen ? "translateY(0)" : "translateY(-50%)",
        }}
      >
        <img
          src={logoAsset.url}
          alt="UniPetit Logo"
          className="object-contain drop-shadow-2xl text-lg transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-[width,transform]"
          style={{
            width: modalOpen
              ? screen === "selection"
                ? "min(90vw, 50vh, 400px)"
                : "min(55vw, 28vh, 220px)"
              : "min(95vw, 80vh, 500px)",
            height: "auto",
            maxWidth: "100%",
            transform: modalOpen ? "scale(1)" : "scale(1.02)",
          }}
          draggable={false}
        />
        {!triggered && (
          <p className="mt-6 animate-pulse text-center text-xs font-medium uppercase tracking-[0.35em] text-white/70">
            Toque para começar
          </p>
        )}
      </div>

      <div
        className="absolute left-1/2 z-20 w-full max-w-[440px] -translate-x-1/2 rounded-t-[32px] bg-white px-7 py-10 transition-[bottom] duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{
          bottom: modalOpen ? 0 : "-100%",
          boxShadow: "var(--shadow-modal)",
        }}
      >
        {screen === "selection" && (
          <Selection
            onLogin={() => setScreen("login")}
            onSignup={() => setScreen("signup")}
          />
        )}
        {screen === "login" && (
          <LoginForm
            onBack={() => setScreen("selection")}
            onForgot={() => setScreen("forgot")}
            onSubmit={async (email, password) => {
              const res = await login(email, password);
              if (res.ok) navigate({ to: "/home" });
              return res;
            }}
          />
        )}
        {screen === "signup" && (
          <SignupForm
            onBack={() => setScreen("selection")}
            onSubmit={async (name, email, password) => {
              const res = await signup(name, email, password);
              if (res.ok) navigate({ to: "/home" });
              return res;
            }}
          />
        )}
        {screen === "forgot" && (
          <ForgotForm
            onBack={() => setScreen("login")}
            onSubmit={(email) => requestPasswordReset(email)}
          />
        )}
      </div>
    </main>
  );
}

function Selection({
  onLogin,
  onSignup,
}: {
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-extrabold text-[#2a0a10]">Bem-vindo!</h2>
      <p className="mt-2 text-sm text-neutral-500">
        Escolha uma das opções abaixo para continuar
      </p>

      <button
        onClick={onLogin}
        className="mt-8 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(93,10,26,0.7)] transition active:scale-[0.98]"
      >
        Entrar
      </button>
      <button
        onClick={onSignup}
        className="mt-3 w-full rounded-2xl border-2 border-[#5d0a1a] px-4 py-3.5 text-sm font-semibold text-[#5d0a1a] transition active:scale-[0.98]"
      >
        Cadastrar-se
      </button>
    </div>
  );
}

function LoginForm({
  onBack,
  onForgot,
  onSubmit,
}: {
  onBack: () => void;
  onForgot: () => void;
  onSubmit: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        const r = await onSubmit(email, password);
        setLoading(false);
        if (!r.ok) setError(r.error ?? "Erro ao entrar");
      }}
      className="flex flex-col"
    >
      <h2 className="text-center text-2xl font-extrabold text-[#2a0a10]">Entrar</h2>
      <p className="mt-1 text-center text-sm text-neutral-500">
        Acesse sua conta UniPetit
      </p>

      <div className="mt-6 space-y-3">
        <Field icon={<Mail size={16} />}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
        </Field>
        <Field icon={<Lock size={16} />}>
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
        </Field>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(93,10,26,0.7)] transition active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <button
        type="button"
        onClick={onForgot}
        className="mt-4 text-center text-xs font-semibold text-[#5d0a1a] hover:underline"
      >
        Esqueci minha senha
      </button>

      <button
        type="button"
        onClick={onBack}
        className="mt-2 text-center text-xs font-semibold text-neutral-500 hover:text-[#5d0a1a]"
      >
        ← Voltar
      </button>
    </form>
  );
}

function SignupForm({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (password.length < 6) {
          setError("A senha deve ter ao menos 6 caracteres");
          return;
        }
        setLoading(true);
        const r = await onSubmit(name, email, password);
        setLoading(false);
        if (!r.ok) setError(r.error ?? "Erro ao cadastrar");
      }}
      className="flex flex-col"
    >
      <h2 className="text-center text-2xl font-extrabold text-[#2a0a10]">
        Cadastrar-se
      </h2>
      <p className="mt-1 text-center text-sm text-neutral-500">
        Crie sua conta gratuita
      </p>

      <div className="mt-6 space-y-3">
        <Field icon={<User size={16} />}>
          <input
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
        </Field>
        <Field icon={<Mail size={16} />}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
        </Field>
        <Field icon={<Lock size={16} />}>
          <input
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
        </Field>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(93,10,26,0.7)] transition active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Criando..." : "Criar conta"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="mt-3 text-center text-xs font-semibold text-neutral-500 hover:text-[#5d0a1a]"
      >
        ← Voltar
      </button>
    </form>
  );
}

function Field({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-neutral-100 px-4 py-3.5">
      <span className="text-neutral-400">{icon}</span>
      {children}
    </label>
  );
}

function ForgotForm({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (email: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <div className="flex flex-col items-center text-center">
        <h2 className="text-2xl font-extrabold text-[#2a0a10]">Verifique seu e-mail</h2>
        <p className="mt-3 text-sm text-neutral-600">
          Enviamos um link de confirmação para
          <br />
          <strong className="text-[#5d0a1a]">{email}</strong>
        </p>
        <p className="mt-3 text-xs text-neutral-500">
          Clique no link recebido para confirmar que é você e definir uma nova senha.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(93,10,26,0.7)] transition active:scale-[0.98]"
        >
          Voltar para o login
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const r = await onSubmit(email);
        setLoading(false);
        if (!r.ok) setError(r.error ?? "Erro ao enviar e-mail");
        else setSuccess(true);
      }}
      className="flex flex-col"
    >
      <h2 className="text-center text-2xl font-extrabold text-[#2a0a10]">
        Esqueci minha senha
      </h2>
      <p className="mt-1 text-center text-sm text-neutral-500">
        Enviaremos um link para o seu e-mail confirmar que é você
      </p>

      <div className="mt-6">
        <Field icon={<Mail size={16} />}>
          <input
            type="email"
            placeholder="E-mail cadastrado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
        </Field>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(93,10,26,0.7)] transition active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Enviar link de confirmação"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="mt-3 text-center text-xs font-semibold text-neutral-500 hover:text-[#5d0a1a]"
      >
        ← Voltar
      </button>
    </form>
  );
}
