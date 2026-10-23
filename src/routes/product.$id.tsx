import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle } from "lucide-react";
import { catalogQueryOptions, settingsQueryOptions } from "@/lib/queries";
import { getProduct } from "@/lib/store.functions";
import { DEFAULT_SALES_WHATSAPP, formatSAR, whatsappLink } from "@/lib/format";
import { productImage } from "@/lib/product-images";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Tilt } from "@/components/tilt";

function queryOptionsForProduct(id: string) {
  return queryOptions({
    queryKey: ["product", id],
    queryFn: () => getProduct({ data: { id } }),
  });
}

export const Route = createFileRoute("/product/$id")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(catalogQueryOptions),
      context.queryClient.ensureQueryData(
        queryOptionsForProduct(params.id),
      ),
    ]).then(([, product]) => {
      if (!product) throw notFound();
    }),
  component: ProductPage,
  head: () => ({
    meta: [
      { title: "تفاصيل المنتج | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content:
          "تفاصيل المنتج وسعره من مؤسسة المتوكل للتجارة — حدد الكمية وأضفها للسلة.",
      },
      { property: "og:title", content: "تفاصيل المنتج | مؤسسة المتوكل للتجارة" },
      {
        property: "og:description",
        content: "تفاصيل المنتج من مؤسسة المتوكل للتجارة — السعر والكمية وإضافة للسلة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: product } = useSuspenseQuery(queryOptionsForProduct(id));
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions);
  const { data: settings } = useQuery(settingsQueryOptions);

  if (!product) return null;
  const category = catalog.categories.find((c) => c.id === product.category_id);

  const quoteMessage = `السلام عليكم، محتاج عرض سعر: ${product.name_ar}${product.specs_ar ? ` (${product.specs_ar})` : ""}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="h-4 w-4" />
        الرئيسية
      </Link>
      {category && (
        <>
          <span className="mx-2 text-muted-foreground">/</span>
          <Link
            {...(category.slug === "hordi"
              ? ({ to: "/hordi" } as const)
              : ({ to: "/category/$slug", params: { slug: category.slug } } as const))}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {category.name_ar}
          </Link>
        </>
      )}

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <Tilt className="overflow-hidden rounded-2xl border bg-card">
          <img
            src={productImage(product.image_url, category?.slug)}
            alt={product.name_ar}
            width={816}
            height={816}
            className="aspect-square w-full object-cover"
          />
        </Tilt>
        <div>
          <h1 className="font-display text-3xl font-bold">{product.name_ar}</h1>
          {product.specs_ar && (
            <p className="mt-2 text-lg text-muted-foreground">{product.specs_ar}</p>
          )}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold">
              {formatSAR(product.price)}
            </span>
            <span className="text-sm text-muted-foreground">/ {product.unit_ar}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            السعر بيتأكد عند إصدار الفاتورة.
          </p>
          <div className="mt-6">
            <ProductCard product={product} categorySlug={category?.slug} />
          </div>
          <Button asChild variant="outline" className="mt-4">
            <a
              href={whatsappLink(settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP, quoteMessage)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              اطلب عرض سعر على واتساب
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
