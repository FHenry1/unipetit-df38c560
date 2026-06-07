import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import logoAsset from "@/assets/unipetit-logo.png.asset.json";

export const Route = createFileRoute("/")({
  component: Landing,
});

type Screen = "selection" | "login" | "signup" | "forgot";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function Landing() {
  const { user, login, signup, requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("selection");
  const [triggered, setTriggered] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) navigate({ to: user.role === "owner" ? "/owner" : "/home" });
  }, [user, navigate]);

  // Subtle parallax on pointer move (mobile-friendly: also tilts on device orientation if available)
  useEffect(() => {
    if (triggered) return;
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setScrollY(0);
      if (heroRef.current) {
        heroRef.current.style.setProperty("--px", String(x));
        heroRef.current.style.setProperty("--py", String(y));
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [triggered]);

  const handleTrigger = () => {
    if (triggered) return;
    setTriggered(true);
    setTimeout(() => setModalOpen(true), 80);
  };

  return (
    <main
      ref={heroRef}
      onClick={handleTrigger}
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#5d0a1a] select-none"
      style={{
        cursor: triggered ? "default" : "pointer",
        // CSS custom props consumed by parallax layers
        ["--px" as never]: 0,
        ["--py" as never]: 0,
      }}
    >
      {/* Decorative parallax background layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-transform duration-300 ease-out"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 15%, rgba(232,93,117,0.35) 0%, transparent 60%), radial-gradient(50% 40% at 85% 80%, rgba(255,180,140,0.18) 0%, transparent 65%), linear-gradient(180deg, #6b0d20 0%, #4a0814 60%, #2a0610 100%)",
          transform:
            "translate3d(calc(var(--px) * -12px), calc(var(--py) * -12px), 0)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay transition-transform duration-500 ease-out"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "22px 22px",
          transform:
            "translate3d(calc(var(--px) * 18px), calc(var(--py) * 18px), 0)",
        }}
      />
      {/* soft floating blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full blur-3xl transition-transform duration-700 ease-out"
        style={{
          background: "radial-gradient(circle, rgba(232,93,117,0.55), transparent 70%)",
          transform: "translate3d(calc(var(--px) * 30px), calc(var(--py) * 30px), 0)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full blur-3xl transition-transform duration-700 ease-out"
        style={{
          background: "radial-gradient(circle, rgba(255,160,120,0.35), transparent 70%)",
          transform: "translate3d(calc(var(--px) * -28px), calc(var(--py) * -28px), 0)",
        }}
      />

      {/* HERO content (visible when modal closed) */}
      <div
        className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 pt-10 pb-32 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.2,1)]"
        style={{
          opacity: modalOpen ? 0 : 1,
          transform: modalOpen ? "translateY(-30px)" : "translateY(0)",
          pointerEvents: modalOpen ? "none" : "auto",
        }}
      >
        <img
          src={logoAsset.url}
          alt="UniPetit"
          draggable={false}
          className="w-[min(70vw,260px)] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
        />
        <h1 className="mt-6 text-center text-[clamp(1.75rem,7vw,2.5rem)] font-extrabold leading-tight tracking-tight text-white">
          Seu lanche,
          <br />
          <span className="bg-gradient-to-r from-[#ffd1b8] to-[#ff9eb3] bg-clip-text text-transparent">
            pertinho de você
          </span>
        </h1>
        <p className="mt-3 max-w-xs text-center text-sm leading-relaxed text-white/75">
          Descubra lanchonetes próximas, faça pedidos em segundos e acompanhe tudo
          em tempo real.
        </p>

        <div className="mt-8 grid w-full grid-cols-3 gap-2.5">
          <Benefit icon={<Zap size={16} />} label="Rápido" />
          <Benefit icon={<MapPin size={16} />} label="Próximo" />
          <Benefit icon={<Sparkles size={16} />} label="Fácil" />
        </div>

        {!triggered && (
          <button
            type="button"
            className="mt-8 rounded-full bg-white/15 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.3em] text-white backdrop-blur-md ring-1 ring-white/25 transition hover:bg-white/25"
          >
            Toque para começar
          </button>
        )}
      </div>

      {/* MODAL bottom-sheet */}
      <div
        className="absolute left-1/2 z-20 w-full max-w-[460px] -translate-x-1/2 rounded-t-[32px] bg-white px-7 pt-7 pb-9 transition-[bottom,transform] duration-700 ease-[cubic-bezier(0.25,1,0.2,1)]"
        style={{
          bottom: modalOpen ? 0 : "-110%",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-neutral-200" />
        <div className="mb-4 flex justify-center">
          <img
            src={logoAsset.url}
            alt=""
            draggable={false}
            className="h-12 w-12 object-contain"
          />
        </div>

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

function Benefit({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 px-2 py-3 text-white backdrop-blur-md ring-1 ring-white/15 transition hover:bg-white/15">
      <span className="text-[#ffd1b8]">{icon}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function GoogleButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { lovable } = await import("@/integrations/lovable");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Falha ao entrar com Google");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      window.location.href = "/home";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao entrar com Google");
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={handleGoogle}
      className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 active:scale-[0.99] disabled:opacity-60"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
      </svg>
      {loading ? "Conectando..." : "Continuar com Google"}
    </button>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-neutral-200" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
        {label}
      </span>
      <div className="h-px flex-1 bg-neutral-200" />
    </div>
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
        Pronto para descobrir seu próximo lanche favorito?
      </p>

      <button
        onClick={onLogin}
        className="mt-7 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-[0_10px_25px_-10px_rgba(93,10,26,0.7)] transition hover:bg-[#6e0e22] active:scale-[0.98]"
      >
        Entrar
      </button>
      <button
        onClick={onSignup}
        className="mt-3 w-full rounded-2xl border-2 border-[#5d0a1a] px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-[#5d0a1a] transition hover:bg-[#5d0a1a]/5 active:scale-[0.98]"
      >
        Criar conta
      </button>

      <Divider label="ou" />
      <GoogleButton />

      <p className="mt-6 text-[11px] leading-relaxed text-neutral-400">
        Ao continuar, você aceita nossos{" "}
        <a className="font-semibold text-[#5d0a1a]">Termos</a> e{" "}
        <a className="font-semibold text-[#5d0a1a]">Privacidade</a>.
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
  onSubmit: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailValid = isValidEmail(email);
  const canSubmit = emailValid && password.length >= 6 && !loading;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const r = await onSubmit(email, password);
        setLoading(false);
        if (!r.ok) setError(r.error ?? "E-mail ou senha incorretos");
      }}
      className="flex flex-col"
    >
      <h2 className="text-center text-2xl font-extrabold text-[#2a0a10]">
        Bem-vindo de volta
      </h2>
      <p className="mt-1 text-center text-sm text-neutral-500">
        Faça login para continuar
      </p>

      <div className="mt-6 space-y-3">
        <Field
          icon={<Mail size={16} />}
          valid={email.length > 0 ? emailValid : undefined}
        >
          <input
            type="email"
            autoComplete="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
        </Field>
        <Field icon={<Lock size={16} />}>
          <input
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
            className="text-neutral-400 transition hover:text-[#5d0a1a]"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </Field>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 animate-[shake_0.4s_ease] rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 ring-1 ring-red-100"
          style={{ animation: "fade-in 200ms ease-out" }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-6 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-[0_10px_25px_-10px_rgba(93,10,26,0.7)] transition hover:bg-[#6e0e22] active:scale-[0.98] disabled:bg-neutral-300 disabled:shadow-none"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>

      <button
        type="button"
        onClick={onForgot}
        className="mt-4 text-center text-xs font-bold text-[#5d0a1a] hover:underline"
      >
        Esqueci minha senha
      </button>

      <Divider label="ou" />
      <GoogleButton disabled={loading} />

      <button
        type="button"
        onClick={onBack}
        className="mt-4 text-center text-xs font-semibold text-neutral-500 hover:text-[#5d0a1a]"
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
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nameValid = name.trim().length >= 2;
  const emailValid = isValidEmail(email);
  const pwdValid = password.length >= 6;
  const strength = passwordStrength(password);
  const canSubmit = nameValid && emailValid && pwdValid && !loading;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        if (!canSubmit) return;
        setLoading(true);
        const r = await onSubmit(name, email, password);
        setLoading(false);
        if (!r.ok) setError(r.error ?? "Não foi possível criar a conta");
      }}
      className="flex flex-col"
    >
      <h2 className="text-center text-2xl font-extrabold text-[#2a0a10]">
        Criar conta
      </h2>
      <p className="mt-1 text-center text-sm text-neutral-500">
        É rapidinho e grátis
      </p>

      <div className="mt-6 space-y-3">
        <Field
          icon={<User size={16} />}
          valid={name.length > 0 ? nameValid : undefined}
        >
          <input
            type="text"
            autoComplete="name"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
        </Field>
        <Field
          icon={<Mail size={16} />}
          valid={email.length > 0 ? emailValid : undefined}
        >
          <input
            type="email"
            autoComplete="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
        </Field>
        <Field
          icon={<Lock size={16} />}
          valid={password.length > 0 ? pwdValid : undefined}
        >
          <input
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
            className="text-neutral-400 transition hover:text-[#5d0a1a]"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </Field>

        {password.length > 0 && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{
                  background:
                    i < strength.score
                      ? strength.color
                      : "rgb(229,229,229)",
                }}
              />
            ))}
            <span
              className="ml-2 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: strength.color }}
            >
              {strength.label}
            </span>
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 ring-1 ring-red-100"
          style={{ animation: "fade-in 200ms ease-out" }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-6 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-[0_10px_25px_-10px_rgba(93,10,26,0.7)] transition hover:bg-[#6e0e22] active:scale-[0.98] disabled:bg-neutral-300 disabled:shadow-none"
      >
        {loading ? "Criando…" : "Criar conta"}
      </button>

      <Divider label="ou" />
      <GoogleButton disabled={loading} />

      <button
        type="button"
        onClick={onBack}
        className="mt-4 text-center text-xs font-semibold text-neutral-500 hover:text-[#5d0a1a]"
      >
        ← Voltar
      </button>
    </form>
  );
}

function passwordStrength(pwd: string) {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: "Fraca", color: "#ef4444" },
    { label: "Fraca", color: "#ef4444" },
    { label: "Razoável", color: "#f59e0b" },
    { label: "Boa", color: "#10b981" },
    { label: "Forte", color: "#059669" },
  ];
  return { score, ...map[score] };
}

function Field({
  icon,
  children,
  valid,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  valid?: boolean;
}) {
  const borderColor =
    valid === true
      ? "ring-1 ring-emerald-300"
      : valid === false
        ? "ring-1 ring-red-200"
        : "ring-1 ring-transparent focus-within:ring-[#5d0a1a]/30";
  return (
    <label
      className={`flex items-center gap-3 rounded-2xl bg-neutral-100 px-4 py-3.5 transition ${borderColor}`}
    >
      <span
        className={`transition-colors ${
          valid === true ? "text-emerald-500" : "text-neutral-400"
        }`}
      >
        {icon}
      </span>
      {children}
      {valid === true && (
        <CheckCircle2
          size={16}
          className="text-emerald-500"
          style={{ animation: "scale-in 200ms ease-out" }}
        />
      )}
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
  const emailValid = isValidEmail(email);

  if (success) {
    return (
      <div
        className="flex flex-col items-center text-center"
        style={{ animation: "fade-in 300ms ease-out" }}
      >
        <div
          className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500"
          style={{ animation: "scale-in 350ms cubic-bezier(0.25,1,0.5,1)" }}
        >
          <CheckCircle2 size={32} strokeWidth={2.4} />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-[#2a0a10]">
          E-mail enviado!
        </h2>
        <p className="mt-3 text-sm text-neutral-600">
          Enviamos um link para
          <br />
          <strong className="text-[#5d0a1a]">{email}</strong>
        </p>
        <p className="mt-3 text-xs text-neutral-500">
          Clique no link recebido para definir uma nova senha.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-[0_10px_25px_-10px_rgba(93,10,26,0.7)] transition hover:bg-[#6e0e22] active:scale-[0.98]"
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
        if (!emailValid) return;
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
        Enviaremos um link para o seu e-mail
      </p>

      <div className="mt-6">
        <Field
          icon={<Mail size={16} />}
          valid={email.length > 0 ? emailValid : undefined}
        >
          <input
            type="email"
            autoComplete="email"
            placeholder="E-mail cadastrado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
          />
        </Field>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 ring-1 ring-red-100"
          style={{ animation: "fade-in 200ms ease-out" }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!emailValid || loading}
        className="mt-6 w-full rounded-2xl bg-[#5d0a1a] px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-[0_10px_25px_-10px_rgba(93,10,26,0.7)] transition hover:bg-[#6e0e22] active:scale-[0.98] disabled:bg-neutral-300 disabled:shadow-none"
      >
        {loading ? "Enviando…" : "Enviar link"}
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
