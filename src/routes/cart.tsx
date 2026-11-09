import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { settingsQueryOptions } from "@/lib/queries";
import { DEFAULT_SALES_WHATSAPP, cartQuoteMessage, whatsappLink } from "@/lib/format";
import { cartLineKey, useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({
    meta: [
      { title: "سلة عرض السعر | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content: "جمّع كل الأصناف والمقاسات والكميات في السلة وابعت طلب عرض سعر واحد على واتساب لمؤسسة المتوكل.",
      },
      { property: "og:title", content: "سلة عرض السعر | مؤسسة المتوكل للتجارة" },
      { property: "og:description", content: "اطلب عرض سعر لكذا صنف مرة واحدة على واتساب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CartPage() {
  const { data: settings } = useQuery(settingsQueryOptions);
  const cart = useCart();
  const wa = settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP;

  if (cart.hydrated && cart.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <ShoppingCart className="h-8 w-8" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">السلة فاضية</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ضيف الأصناف اللي محتاجها بالمقاس والكمية، وبعدين ابعت عرض السعر كله مرة واحدة على واتساب.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/">تصفح المنتجات</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">سلة عرض السعر</h1>
      <p className="mt-1 text-sm text-muted-foreground">راجع الأصناف والكميات وابعتها للمبيعات.</p>
      <ul className="mt-6 divide-y rounded-2xl border bg-card">
        {cart.items.map((it) => {
          const key = cartLineKey(it);
          return (
            <li key={key} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold">{it.name}</p>
                {it.specs && <p className="text-sm text-muted-foreground">{it.specs}</p>}
              </div>
              <div className="flex items-center rounded-lg border">
                <button type="button" aria-label="زيادة" className="flex h-9 w-9 items-center justify-center hover:bg-muted" onClick={() => cart.setQty(key, it.qty + 1)}>
                  <Plus className="h-4 w-4" />
                </button>
                <span className="w-16 text-center text-sm">{it.qty} {it.unit}</span>
                <button type="button" aria-label="إنقاص" className="flex h-9 w-9 items-center justify-center hover:bg-muted" onClick={() => cart.setQty(key, it.qty - 1)}>
                  <Minus className="h-4 w-4" />
                </button>
              </div>
              <Button variant="ghost" size="icon" aria-label="شيل الصنف" onClick={() => cart.remove(key)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="lg" className="flex-1">
          <a href={whatsappLink(wa, cartQuoteMessage(cart.items))} target="_blank" rel="noreferrer">
            <MessageCircle className="h-4 w-4" />
            ابعت عرض السعر على واتساب
          </a>
        </Button>
        <Button variant="outline" size="lg" onClick={() => cart.clear()}>
          فضّي السلة
        </Button>
      </div>
    </div>
  );
}
