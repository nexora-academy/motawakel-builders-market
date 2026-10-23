import { Link } from "@tanstack/react-router";
import { HORDI_PRESSURES } from "@/lib/hordi";

// تبويب الهوردي — كل ضغط ليه صفحة
export function HordiTabs() {
  return (
    <nav
      aria-label="ضغوط الهوردي"
      className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border bg-card p-2 shadow-3d"
    >
      <Link
        to="/hordi"
        activeOptions={{ exact: true }}
        className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors hover:bg-muted"
        activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
      >
        الكل
      </Link>
      {HORDI_PRESSURES.map((p) => (
        <Link
          key={p}
          to="/hordi/$pressure"
          params={{ pressure: String(p) }}
          className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition-colors hover:bg-muted"
          activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
        >
          ضغط {p}
        </Link>
      ))}
    </nav>
  );
}
