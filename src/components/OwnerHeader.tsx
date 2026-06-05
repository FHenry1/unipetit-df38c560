import logoAsset from "@/assets/unipetit-logo.png.asset.json";

export function OwnerHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="relative bg-gradient-to-br from-[#5d0a1a] via-[#4a0814] to-[#2a0610] px-5 pt-8 pb-12 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="UniPetit"
            className="h-10 w-10 rounded-xl bg-white/10 p-1 object-contain"
            draggable={false}
          />
          <div>
            {subtitle && (
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">
                {subtitle}
              </p>
            )}
            <h1 className="text-lg font-extrabold leading-tight">{title}</h1>
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}
