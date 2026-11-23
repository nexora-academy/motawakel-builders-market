import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle } from "lucide-react";
import { catalogQueryOptions, settingsQueryOptions } from "@/lib/queries";
import { isHordiPressure, parseSize, productsForPressure } from "@/lib/hordi";
import { DEFAULT_SALES_WHATSAPP, whatsappLink } from "@/lib/format";
import { HordiTabs } from "@/components/hordi-tabs";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/hordi/$pressure")({
  beforeLoad: ({ params }) => {
    if (!isHordiPressure(Number(params.pressure))) throw notFound();
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
  component: HordiPressurePage,
  head: ({ params }) => ({
    meta: [
      { title: `هوردي ضغط ${params.pressure} بالرياض | مؤسسة المتوكل للتجارة` },
      {
        name: "description",
        content: `كل مقاسات هوردي ضغط ${params.pressure} — اختار المقاس والكمية واطلب عرض سعر على واتساب.`,
      },
      { property: "og:title", content: `هوردي ضغط ${params.pressure} بالرياض | مؤسسة المتوكل للتجارة` },
      {
        property: "og:description",
        content: `شوف مقاسات هوردي ضغط ${params.pressure} وكلم المبيعات على واتساب.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `https://motawakel-builders-market.lovable.app/hordi/${params.pressure}` },
    ],
    links: [{ rel: "canonical", href: `https://motawakel-builders-market.lovable.app/hordi/${params.pressure}` }],
  }),
});

function HordiPressurePage() {
  const { pressure } = Route.useParams();
  const p = Number(pressure);
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions);
  const { data: settings } = useQuery(settingsQueryOptions);
  const salesWa = settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP;

  const hordiCat = catalog.categories.find((c) => c.slug === "hordi");
  const products = productsForPressure(
    catalog.products.filter((pr) => pr.category_id === hordiCat?.id),
    p,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowRight className="h-4 w-4" />
          الرئيسية
        </Link>
        <span>/</span>
        <Link to="/hordi" className="hover:text-foreground">
          الهوردي
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <span className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-3d">
          <span className="text-[10px] opacity-80">ضغط</span>
          <span className="font-display text-3xl font-extrabold leading-none">{p}</span>
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold">هوردي ضغط {p}</h1>
          <p className="mt-1 text-muted-foreground">
            اختار المقاس وحدد الكمية واطلب السعر على واتساب — {products.length} مقاسات
          </p>
        </div>
      </div>

      <HordiTabs />

      {products.length === 0 ? (
        <div className="mt-10 rounded-2xl border bg-card p-8 text-center">
          <p className="text-muted-foreground">مفيش مقاسات مضافة للضغط ده لسه.</p>
          <Button asChild className="mt-4">
            <a
              href={whatsappLink(salesWa, `السلام عليكم، محتاج هوردي ضغط ${p}`)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              اطلبه على واتساب
            </a>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((pr) => {
            const size = parseSize(pr.name_ar);
            return (
              <ProductCard
                key={pr.id}
                product={pr}
                categorySlug="hordi"
                title={size ? `مقاس \u200e${size}\u200e` : pr.name_ar}
                subtitle={`ضغط ${p} — سم`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
