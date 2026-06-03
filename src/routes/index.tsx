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
  const { user, login, signup, resetPassword } = useAuth();
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
    // small delay so logo translation can settle before modal appears
    setTimeout(() => setModalOpen(true), 80);
  };

  return (
    <main
      onClick={handleTrigger}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#5d0a1a] select-none"
      style={{ cursor: triggered ? "default" : "pointer" }}
    >
      {/* Logo block — moves up when modal opens */}
      <div
        className="z-10 transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{
          transform: modalOpen ? "translateY(-22vh)" : "translateY(0)",
        }}
      >
        <img
          src={logoAsset.url}
          alt="UniPetit Logo"
          className="object-contain drop-shadow-2xl"
          style={{ width: 500, height: 500 }}
          draggable={false}
        />
        {!triggered && (
          <p className="mt-6 animate-pulse text-center text-xs font-medium uppercase tracking-[0.35em] text-white/70">
            Toque para começar
          </p>
        )}
      </div>

      {/* Slide-up modal */}
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
            onSubmit={(email, password) => {
              const res = login(email, password);
              if (res.ok) {
                navigate({ to: "/home" });
              }
              return res;
            }}
          />
        )}
        {screen === "signup" && (
          <SignupForm
            onBack={() => setScreen("selection")}
            onSubmit={(name, email, password) => {
              const res = signup(name, email, password);
              if (res.ok) {
                navigate({ to: "/home" });
              }
              return res;
            }}
          />
        )}
        {screen === "forgot" && (
          <ForgotForm
            onBack={() => setScreen("login")}
            onSubmit={(email, password) => resetPassword(email, password)}
          />
        )}
      </div>
    </main>
  );
}

/* ---------- Sub screens ---------- */

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

      <p className="mt-6 text-[11px] text-neutral-400">
        Demo: <strong>user@unipetit.com</strong> / <strong>password123</strong>
      </p>
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
  onSubmit: (email: string, password: string) => { ok: boolean; error?: string };
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const r = onSubmit(email, password);
        if (!r.ok) setError(r.error ?? "Erro ao entrar");
      }}
      className="flex flex-col"
    >
      <h2 className="text-center text-2xl font-extrabold text-[#2a0a10]">
        Entrar
      </h2>
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
        className="mt-6 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(93,10,26,0.7)] transition active:scale-[0.98]"
      >
        Entrar
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
  ) => { ok: boolean; error?: string };
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (password.length < 6) {
          setError("A senha deve ter ao menos 6 caracteres");
          return;
        }
        const r = onSubmit(name, email, password);
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
        className="mt-6 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(93,10,26,0.7)] transition active:scale-[0.98]"
      >
        Criar conta
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
  onSubmit: (email: string, password: string) => { ok: boolean; error?: string };
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <div className="flex flex-col items-center text-center">
        <h2 className="text-2xl font-extrabold text-[#2a0a10]">
          Senha redefinida!
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Sua nova senha foi salva. Use-a para entrar.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(93,10,26,0.7)] transition active:scale-[0.98]"
        >
          Ir para o login
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (password.length < 6) {
          setError("A senha deve ter ao menos 6 caracteres");
          return;
        }
        if (password !== confirm) {
          setError("As senhas não conferem");
          return;
        }
        const r = onSubmit(email, password);
        if (!r.ok) setError(r.error ?? "Erro ao redefinir senha");
        else setSuccess(true);
      }}
      className="flex flex-col"
    >
      <h2 className="text-center text-2xl font-extrabold text-[#2a0a10]">
        Esqueci minha senha
      </h2>
      <p className="mt-1 text-center text-sm text-neutral-500">
        Informe seu e-mail e defina uma nova senha
      </p>

      <div className="mt-6 space-y-3">
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
        <Field icon={<Lock size={16} />}>
          <input
            type="password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
        </Field>
        <Field icon={<Lock size={16} />}>
          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
        className="mt-6 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(93,10,26,0.7)] transition active:scale-[0.98]"
      >
        Redefinir senha
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
