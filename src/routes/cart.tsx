import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle, ShoppingCart, Trash2 } from "lucide-react";
import { settingsQueryOptions } from "@/lib/queries";
import { useCart } from "@/lib/cart";
import { formatSAR, whatsappLink } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({
    meta: [
      { title: "سلة المشتريات | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content: "راجع الأغراض والكميات في سلتك وأكمل الطلب من مؤسسة المتوكل للتجارة.",
      },
      { property: "og:title", content: "سلة المشتريات | مؤسسة المتوكل للتجارة" },
      {
        property: "og:description",
        content: "راجع الأغراض والكميات في سلتك وأكمل الطلب.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CartPage() {
  const { items, total, hydrated, setQty, remove } = useCart();
  const { data: settings } = useQuery(settingsQueryOptions);

  const quoteMessage = [
    "السلام عليكم، محتاج عرض سعر للأغراض دي من مؤسسة المتوكل:",
    ...items.map(
      (it) =>
        `• ${it.name}${it.specs ? ` (${it.specs})` : ""} — الكمية: ${it.qty} ${it.unit} — ${formatSAR(it.price * it.qty)}`,
    ),
    `الإجمالي التقريبي: ${formatSAR(total)}`,
  ].join("\n");

  if (!hydrated) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">جارٍ التحميل…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold">سلتك فاضية</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          اتصفح الأقسام واختار الأغراض اللي محتاجها.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">ابدأ التسوق</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        متابعة التسوق
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">سلة المشتريات</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-display">الأغراض المطلوبة</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {items.map((it) => (
            <div key={it.productId} className="flex items-center gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold">{it.name}</p>
                {it.specs && (
                  <p className="text-sm text-muted-foreground">{it.specs}</p>
                )}
                <p className="mt-1 text-sm">
                  {formatSAR(it.price)} / {it.unit}
                </p>
              </div>
              <div className="flex items-center rounded-lg border">
                <button
                  type="button"
                  aria-label="زيادة"
                  className="flex h-9 w-9 items-center justify-center hover:bg-muted"
                  onClick={() => setQty(it.productId, it.qty + 1)}
                >
                  +
                </button>
                <input
                  aria-label={`كمية ${it.name}`}
                  inputMode="decimal"
                  className="h-9 w-14 border-x bg-transparent text-center text-sm outline-none"
                  value={it.qty}
                  onChange={(e) => {
                    const v = Number(e.target.value.replace(/[^\d.]/g, ""));
                    setQty(it.productId, Number.isFinite(v) ? v : 0);
                  }}
                />
                <button
                  type="button"
                  aria-label="إنقاص"
                  className="flex h-9 w-9 items-center justify-center hover:bg-muted"
                  onClick={() => setQty(it.productId, it.qty - 1)}
                >
                  −
                </button>
              </div>
              <span className="w-24 text-left font-display font-bold">
                {formatSAR(it.price * it.qty)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="حذف"
                onClick={() => remove(it.productId)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between py-4">
            <span className="font-display text-lg font-bold">الإجمالي التقريبي</span>
            <span className="font-display text-2xl font-bold">{formatSAR(total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/checkout">إتمام الشراء</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a
            href={whatsappLink(settings?.["sales_whatsapp"] ?? "", quoteMessage)}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            طلب عرض سعر على واتساب
          </a>
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        الأسعار تقديرية ويتم تأكيدها عند إصدار الفاتورة من المسؤول.
      </p>
    </div>
  );
}
