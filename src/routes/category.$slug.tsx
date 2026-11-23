import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle } from "lucide-react";
import { catalogQueryOptions, settingsQueryOptions } from "@/lib/queries";
import { DEFAULT_SALES_WHATSAPP, whatsappLink } from "@/lib/format";
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
      { title: `${categoryTitle(params.slug)} بالرياض | مؤسسة المتوكل للتجارة` },
      {
        name: "description",
        content: `تصفح منتجات ${categoryTitle(params.slug)} في الرياض واطلب عرض سعر على واتساب من مؤسسة المتوكل للتجارة.`,
      },
      { property: "og:title", content: `${categoryTitle(params.slug)} بالرياض | مؤسسة المتوكل للتجارة` },
      {
        property: "og:description",
        content: `اختار منتجات ${categoryTitle(params.slug)} وكلم المبيعات على واتساب.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `https://motawakel-builders-market.lovable.app/category/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `https://motawakel-builders-market.lovable.app/category/${params.slug}` }],
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

  const category = catalog.categories.find((c) => c.slug === slug);
  const products = catalog.products.filter((p) => p.category_id === category?.id);
  const title = category?.name_ar ?? categoryTitle(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        الرئيسية
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
        </div>
        <Button asChild variant="outline">
          <a
            href={whatsappLink(
              settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP,
              `السلام عليكم، محتاج عرض سعر من قسم ${title}`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            كلم المبيعات
          </a>
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="mt-10 rounded-2xl border bg-card p-8 text-center">
          <p className="text-muted-foreground">لا توجد منتجات في هذا القسم حاليًا.</p>
          <Button asChild className="mt-4">
            <a
              href={whatsappLink(
                settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP,
                `السلام عليكم، محتاج أستفسر عن منتجات قسم ${title}`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              استفسر على واتساب
            </a>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} categorySlug={slug} />
          ))}
        </div>
      )}
    </div>
  );
}
