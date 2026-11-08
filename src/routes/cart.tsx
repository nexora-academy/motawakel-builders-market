import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { settingsQueryOptions } from "@/lib/queries";
import { DEFAULT_SALES_WHATSAPP, whatsappLink } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cart")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "تواصل مع المبيعات | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content: "اختار الأصناف والمقاسات والكميات واطلب عرض سعر على واتساب من مؤسسة المتوكل للتجارة.",
      },
      { property: "og:title", content: "تواصل مع المبيعات | مؤسسة المتوكل للتجارة" },
      {
        property: "og:description",
        content: "كلم مسؤول المبيعات على واتساب واعرف السعر والتوفر.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ContactPage() {
  const { data: settings } = useQuery(settingsQueryOptions);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <MessageCircle className="h-8 w-8" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold">طلبك كله على واتساب</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        تصفح الأقسام، واختار الصنف والمقاس والكمية، وابعت طلبك لمسؤول المبيعات لمعرفة السعر والتوفر.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <a
            href={whatsappLink(
              settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP,
              "السلام عليكم، محتاج عرض سعر من مؤسسة المتوكل",
            )}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            كلمنا على واتساب
          </a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/">تصفح المنتجات</Link>
        </Button>
      </div>
    </div>
  );
}
