import logoAsset from "@/assets/unipetit-logo.png.asset.json";

type LogoProps = {
  /** Optional fixed size in pixels. When omitted, the logo scales responsively. */
  size?: number;
  withTagline?: boolean;
};

export function Logo({ size }: LogoProps) {
  // Responsive default: scales between 88px and 128px based on viewport width.
  // Using inline style keeps aspect ratio and avoids distortion at any width.
  const style: React.CSSProperties = size
    ? { width: size, height: size }
    : { width: "clamp(88px, 22vw, 128px)", aspectRatio: "1 / 1", height: "auto" };

  return (
    <div className="flex w-full justify-center">
      <img
        src={logoAsset.url}
        alt="UniPetit Logo"
        style={{ ...style, objectFit: "contain", display: "block", maxWidth: "100%" }}
        draggable={false}
      />
    </div>
  );
}
