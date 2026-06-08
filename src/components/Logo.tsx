import logoAsset from "@/assets/unipetit-logo-v2.png.asset.json";

type LogoProps = {
  /** Optional fixed size in pixels. When omitted, the logo scales responsively. */
  size?: number;
  withTagline?: boolean;
};

export function Logo({ size }: LogoProps) {
  const style: React.CSSProperties = size
    ? { width: size, height: size }
    : { width: "clamp(88px, 22vw, 128px)", aspectRatio: "1 / 1", height: "auto" };

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2">
      <img
        src={logoAsset.url}
        alt="UniPetit Logo"
        style={{ ...style, objectFit: "contain", display: "block", maxWidth: "100%" }}
        draggable={false}
      />
      <span className="text-2xl font-extrabold tracking-wide text-white">
        unipetit
      </span>
    </div>
  );
}
