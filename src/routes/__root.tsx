import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { SiteHeader, CATEGORY_LINKS } from "@/components/site-header";
import { Facebook, Instagram } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/social";
import { TikTokIcon } from "@/components/tiktok-icon";
import { BrandLogo } from "@/components/brand-logo";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">٤٠٤</h1>
        <h2 className="mt-4 font-display text-xl font-semibold">
          الصفحة غير موجودة
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة اللي بتدور عليها غير موجودة أو تم نقلها.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight">
          حصلت مشكلة في تحميل الصفحة
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          جرب تحديث الصفحة أو الرجوع للرئيسية.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            المحاولة مرة تانية
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "مؤسسة المتوكل للتجارة | مواد بناء وعوازل" },
      {
        name: "description",
        content:
          "مؤسسة المتوكل للتجارة: أدوات بناء أساسية، رولات عزل، أدوات لياسة، والهوردي بجميع مقاساته. اطلب عرض سعر على واتساب.",
      },
      { name: "author", content: "مؤسسة المتوكل للتجارة" },
      { property: "og:title", content: "مؤسسة المتوكل للتجارة | مواد بناء وعوازل" },
      {
        property: "og:description",
        content:
          "أدوات بناء أساسية، رولات عزل، أدوات لياسة، والهوردي بجميع مقاساته. كلم المبيعات على واتساب.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&family=Tajawal:wght@400;500;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">
            {/* Required: nested routes render here. */}
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <Toaster position="top-center" dir="rtl" richColors />
      </CartProvider>
    </QueryClientProvider>
  );
}

function SiteFooter() {
  return (
    <footer className="no-print border-t bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <BrandLogo />
          <p className="mt-3 text-sm opacity-80">
            مؤسسة المتوكل للتجارة — متخصصون في تجارة مواد البناء والعوازل.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="فيسبوك مؤسسة المتوكل"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="إنستجرام مؤسسة المتوكل"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noreferrer"
              aria-label="تيك توك مؤسسة المتوكل"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <TikTokIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
        <div>
          <h4 className="font-display text-sm font-bold">الأقسام</h4>
          <ul className="mt-2 space-y-1 text-sm opacity-80">
            {CATEGORY_LINKS.map((link) => (
              <li key={link.slug}>
                <Link
                  to="/category/$slug"
                  params={{ slug: link.slug }}
                  className="hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/hordi" className="hover:underline">
                الهوردي
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm font-bold">روابط سريعة</h4>
          <ul className="mt-2 space-y-1 text-sm opacity-80">
            <li>
              <Link to="/about" className="hover:underline">
                من نحن
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:underline">
                تسجيل الدخول / حساب جديد
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} مؤسسة المتوكل للتجارة — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
