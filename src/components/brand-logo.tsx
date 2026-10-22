import { LOGO_POLYGONS, LOGO_VIEWBOX, polygonToPath } from "@/lib/logo-geometry";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
      className={cn("h-10 w-auto", className)}
      fill="currentColor"
      role="img"
      aria-label="شعار مؤسسة المتوكل"
    >
      {LOGO_POLYGONS.map((poly, i) => (
        <path key={i} d={polygonToPath(poly)} />
      ))}
    </svg>
  );
}

export function BrandLogo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-10" />
      <span className="leading-tight">
        <span className="block font-display text-base font-bold">مؤسسة المتوكل</span>
        {!compact && (
          <span
            dir="ltr"
            className="block font-display text-[10px] font-extrabold tracking-[0.32em] opacity-70"
          >
            ALMOTAWAKEL
          </span>
        )}
      </span>
    </span>
  );
}
