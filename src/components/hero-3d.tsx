import { lazy, Suspense, useEffect, useState } from "react";
import { LogoMark } from "@/components/brand-logo";

const HeroScene = lazy(() => import("./hero-scene"));

function Fallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <LogoMark className="h-40 text-primary-foreground/80 drop-shadow-2xl" />
    </div>
  );
}

// المشهد الثلاثي الأبعاد بيتحمل في المتصفح بس (مش على السيرفر)
export function Hero3D() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <Fallback />;
  return (
    <Suspense fallback={<Fallback />}>
      <HeroScene />
    </Suspense>
  );
}
