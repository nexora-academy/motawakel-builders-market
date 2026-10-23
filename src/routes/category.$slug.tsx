import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle } from "lucide-react";
import { catalogQueryOptions, settingsQueryOptions } from "@/lib/queries";
import { useCart } from "@/lib/cart";
import { DEFAULT_SALES_WHATSAPP, formatSAR, whatsappLink } from "@/lib/format";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/category/$slug")({
  beforeLoad: ({ params }) => {
    // الهوردي ليه تبويب خاص مقسم بالضغط
    if (params.slug === "hordi") throw redirect({ to: "/hordi" });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
  component: CategoryPage,
  head: ({ params }) => ({
    meta: [
      { title: `${categoryTitle(params.slug)} | مؤسسة المتوكل للتجارة` },
      {
        name: "description",
        content: `تصفح واشترِ منتجات ${categoryTitle(params.slug)} من مؤسسة المتوكل للتجارة مع فاتورة ودفع إلكتروني.`,
      },
      { property: "og:title", content: `${categoryTitle(params.slug)} | مؤسسة المتوكل للتجارة` },
      {
        property: "og:description",
        content: `تصفح واشترِ منتجات ${categoryTitle(params.slug)} من مؤسسة المتوكل للتجارة.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function categoryTitle(slug: string): string {
  switch (slug) {
    case "tools-basics":
      return "أدوات البناء الأساسية";
    case "insulation-rolls":
      return "رولات العزل";
    case "plaster-tools":
      return "أدوات اللياسة";
    case "hordi":
      return "الهوردي";
    default:
      return "المنتجات";
  }
}

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions);
  const { data: settings } = useQuery(settingsQueryOptions);
  const { items, total } = useCart();

  const category = catalog.categories.find((c) => c.slug === slug);
  const products = catalog.products.filter((p) => p.category_id === category?.id);

  const quoteMessage = [
    "السلام عليكم، محتاج عرض سعر للأغراض دي من مؤسسة المتوكل:",
    ...items.map(
      (it) =>
        `• ${it.name}${it.specs ? ` (${it.specs})` : ""} — الكمية: ${it.qty} ${it.unit} — ${formatSAR(it.price * it.qty)}`,
    ),
    `الإجمالي التقريبي: ${formatSAR(total)}`,
  ].join("\n");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        الرئيسية
      </Link>

      <h1 className="mt-4 font-display text-3xl font-bold">
        {category?.name_ar ?? categoryTitle(slug)}
      </h1>
      {category?.description_ar && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{category.description_ar}</p>
      )}

      {slug === "hordi" && (
        <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
          محتاج مقاس ضغط أو مقاس تاني مش موجود؟{" "}
          <a
            href={whatsappLink(settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP, "السلام عليكم، محتاج هوردي بمقاس مخصص")}
            target="_blank"
            rel="noreferrer"
            className="font-bold underline"
          >
            اطلبه على واتساب
          </a>
        </div>
      )}

      {products.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">
          لا توجد منتجات في هذا القسم حاليًا.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} categorySlug={slug} />
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="sticky bottom-4 mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-lg">
          <p className="text-sm">
            السلة فيها <b>{items.length}</b> نوع بإجمالي تقريبي{" "}
            <b>{formatSAR(total)}</b>
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a
                href={whatsappLink(settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP, quoteMessage)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                عرض سعر على واتساب
              </a>
            </Button>
            <Button asChild>
              <Link to="/cart">إتمام الشراء</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
