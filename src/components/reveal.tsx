import { useEffect, useRef, type ReactNode } from "react";

/** Text that appears word by word (pure CSS, SSR-safe). */
export function WordReveal({ text, delay = 0, step = 90 }: { text: string; delay?: number; step?: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span className="word-reveal" style={{ animationDelay: `${delay + i * step}ms` }}>
            {w}
          </span>{" "}
        </span>
      ))}
    </>
  );
}

/** Grid whose children fade in row by row as they scroll into view. */
export function RevealGrid({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const items = Array.from(el.children) as HTMLElement[];
    let lastTop = -1;
    let col = 0;
    for (const it of items) {
      if (it.offsetTop !== lastTop) {
        lastTop = it.offsetTop;
        col = 0;
      }
      it.style.transitionDelay = `${col * 110}ms`;
      col++;
      it.classList.add("reveal-item");
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    items.forEach((it) => io.observe(it));
    return () => io.disconnect();
  }, [children]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
