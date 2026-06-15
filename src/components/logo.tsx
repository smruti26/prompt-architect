import logo from "@/assets/logo.png";

export function Logo({ size = 28, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={logo} alt="ArchAI logo" width={size} height={size} className="rounded-md" />
      {withText && (
        <span className="font-display text-base font-semibold tracking-tight">
          <span className="gradient-text">Arch</span>AI
        </span>
      )}
    </div>
  );
}
