import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  HardHat,
  ShoppingCart,
  Menu,
  LogOut,
  LayoutDashboard,
  Package,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
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
  { slug: "hordi", label: "الهوردي" },
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
    </>
  );

  return (
    <header className="no-print sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HardHat className="h-6 w-6" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-bold">
              مؤسسة المتوكل
            </span>
            <span className="block text-[11px] text-muted-foreground">
              للتجارة — مواد بناء وعوازل
            </span>
          </span>
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
