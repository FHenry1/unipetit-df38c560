import logoAsset from "@/assets/unipetit-logo.png.asset.json";

export function Logo({ size = 120 }: { size?: number; withTagline?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <img
        src={logoAsset.url}
        alt="UniPetit Logo"
        style={{ width: size, height: size, objectFit: "contain" }}
        draggable={false}
      />
    </div>
  );
}
