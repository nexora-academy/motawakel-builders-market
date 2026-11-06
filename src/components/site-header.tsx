import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  MessageCircle,
  ShoppingCart,
  Menu,
  LogOut,
  LayoutDashboard,
  Package,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { DEFAULT_SALES_WHATSAPP, whatsappLink } from "@/lib/format";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const CATEGORY_LINKS = [
  { slug: "tools-basics", label: "أدوات البناء" },
  { slug: "insulation-rolls", label: "رولات العزل" },
  { slug: "plaster-tools", label: "أدوات اللياسة" },
] as const;

type SessionState = {
  userId: string | null;
  isAdmin: boolean;
  loaded: boolean;
};

export function SiteHeader() {
  const { count, hydrated } = useCart();
  const [session, setSession] = useState<SessionState>({
    userId: null,
    isAdmin: false,
    loaded: false,
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        setSession({ userId: null, isAdmin: false, loaded: true });
        return;
      }
      const { data: roleData } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: "admin",
      });
      if (!active) return;
      setSession({
        userId: data.user.id,
        isAdmin: roleData === true,
        loaded: true,
      });
    };

    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void load();
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const navLinks = (
    <>
      <Link
        to="/"
        className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        activeProps={{ className: "bg-muted text-accent-foreground" }}
      >
        الرئيسية
      </Link>
      {CATEGORY_LINKS.map((link) => (
        <Link
          key={link.slug}
          to="/category/$slug"
          params={{ slug: link.slug }}
          className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          activeProps={{ className: "bg-muted text-accent-foreground" }}
        >
          {link.label}
        </Link>
      ))}
      <Link
        to="/hordi"
        className="rounded-md px-3 py-2 text-sm font-bold transition-colors hover:bg-muted"
        activeProps={{ className: "bg-accent text-accent-foreground hover:bg-accent" }}
      >
        الهوردي
      </Link>
    </>
  );

  return (
    <header className="no-print sticky top-0 z-50 border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-3 px-4 text-xs">
          <span className="truncate opacity-80">مواد بناء وعوازل — توصيل لموقعك</span>
          <a
            href={whatsappLink(DEFAULT_SALES_WHATSAPP, "السلام عليكم، محتاج عرض سعر من مؤسسة المتوكل")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-bold hover:underline"
          >
            <MessageCircle className="h-3 w-3" />
            اطلب عرض سعر على واتساب
          </a>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4">
        <Link to="/" aria-label="مؤسسة المتوكل — الرئيسية">
          <BrandLogo />
        </Link>

        <nav className="mr-4 hidden items-center gap-1 lg:flex">{navLinks}</nav>

        <div className="flex-1" />

        {session.loaded && session.isAdmin && (
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/admin">
              <LayoutDashboard className="h-4 w-4" />
              لوحة التحكم
            </Link>
          </Button>
        )}
        {session.loaded && session.userId && (
          <>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/account">
                <Package className="h-4 w-4" />
                طلباتي
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => void signOut()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
        {session.loaded && !session.userId && (
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">تسجيل الدخول</Link>
          </Button>
        )}

        <ThemeToggle />
        <Button asChild variant="outline" size="sm" className="relative">
          <Link to="/cart" aria-label="سلة المشتريات">
            <ShoppingCart className="h-5 w-5" />
            {hydrated && count > 0 && (
              <span className="absolute -top-2 -left-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
                {count > 999 ? "999+" : count}
              </span>
            )}
          </Link>
        </Button>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden" aria-label="القائمة">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="font-display">القائمة</SheetTitle>
            <nav className="mt-4 flex flex-col gap-1">
              {navLinks}
              <div className="my-2 border-t" />
              {session.isAdmin && (
                <Link to="/admin" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                  لوحة التحكم
                </Link>
              )}
              {session.userId ? (
                <>
                  <Link to="/account" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                    طلباتي
                  </Link>
                  <button
                    className="rounded-md px-3 py-2 text-right text-sm font-medium hover:bg-muted"
                    onClick={() => void signOut()}
                  >
                    تسجيل الخروج
                  </button>
                </>
              ) : (
                <Link to="/auth" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                  تسجيل الدخول
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
