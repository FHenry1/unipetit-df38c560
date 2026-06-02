export function Logo({ size = 56 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="grid place-items-center rounded-2xl bg-brand shadow-glow"
        style={{ width: size, height: size }}
      >
        {/* Stylized paw / burger mark */}
        <svg
          viewBox="0 0 32 32"
          width={size * 0.6}
          height={size * 0.6}
          fill="none"
        >
          <circle cx="9" cy="10" r="3" fill="white" />
          <circle cx="16" cy="7" r="3" fill="white" />
          <circle cx="23" cy="10" r="3" fill="white" />
          <circle cx="6" cy="17" r="2.5" fill="white" />
          <circle cx="26" cy="17" r="2.5" fill="white" />
          <path
            d="M10 21c0-3.3 2.7-6 6-6s6 2.7 6 6c0 3-2.5 5-6 5s-6-2-6-5z"
            fill="white"
          />
        </svg>
      </div>
      <div className="text-center leading-tight">
        <div className="text-xl font-extrabold tracking-tight text-brand">
          UNIPETIT
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Seu lanche, do petit ao maxi
        </div>
      </div>
    </div>
  );
}
