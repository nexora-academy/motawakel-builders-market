import { code39Bars } from "@/lib/barcode";

export function Barcode({ value, className }: { value: string; className?: string }) {
  const { bars, width, text } = code39Bars(value);
  const quiet = 10;
  const height = 48;
  return (
    <div className={className} dir="ltr">
      <svg
        viewBox={`0 0 ${width + quiet * 2} ${height}`}
        className="h-12 w-full max-w-[240px] fill-foreground"
        role="img"
        aria-label={`باركود ${text}`}
        preserveAspectRatio="none"
      >
        {bars.map((b, i) => (
          <rect key={i} x={b.x + quiet} y={0} width={b.width} height={height} />
        ))}
      </svg>
      <p className="mt-1 text-center font-mono text-[11px] tracking-[0.25em] text-muted-foreground">
        {text}
      </p>
    </div>
  );
}
