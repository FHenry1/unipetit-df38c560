import logoAsset from "@/assets/unipetit-logo.png.asset.json";

export function Logo({ size = 120, withTagline = true }: { size?: number; withTagline?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={logoAsset.url}
        alt="UniPetit Logo"
        style={{ width: size, height: size, objectFit: "contain" }}
        draggable={false}
      />
      {withTagline && (
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Seu lanche, do petit ao maxi
        </div>
      )}
    </div>
  );
}
