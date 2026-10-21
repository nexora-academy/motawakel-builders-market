import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle } from "lucide-react";
import { catalogQueryOptions, settingsQueryOptions } from "@/lib/queries";
import { getProduct } from "@/lib/store.functions";
import { useCart } from "@/lib/cart";
import { formatSAR, whatsappLink } from "@/lib/format";
import { ProductCard } from "@/components/product-card";

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
  head: ({ params }) => ({
    meta: [
      { title: "تفاصيل المنتج | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content: `تفاصيل المنتج ${params.id} من مؤسسة المتوكل للتجارة — السعر والكمية وإضافة للسلة.`,
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

import { queryOptions } from "@tanstack/react-query";

function queryOptionsForProduct(id: string) {
  return queryOptions({
    queryKey: ["product", id],
    queryFn: () => getProduct({ data: { id } }),
  });
}

function ProductPage() {
  const { id } = Route.useParams();
  const { data: product } = useSuspenseQuery(queryOptionsForProduct(id));
  const { data: catalog } = useSuspenseQuery(catalogQueryOptions);
  const { data: settings } = useQuery(settingsQueryOptions);

  if (!product) return null;
  const category = catalog.categories.find((c) => c.id === product.category_id);

  const quoteMessage = `السلام عليكم، محتاج عرض سعر: ${product.name_ar}${product.specs_ar ? ` (${product.specs_ar})` : ""}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
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
            to="/category/$slug"
            params={{ slug: category.slug }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {category.name_ar}
          </Link>
        </>
      )}

      <h1 className="mt-6 font-display text-3xl font-bold">{product.name_ar}</h1>
      {product.specs_ar && (
        <p className="mt-2 text-lg text-muted-foreground">{product.specs_ar}</p>
      )}

      <div className="mt-6 rounded-2xl border bg-card p-6">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold">
            {formatSAR(product.price)}
          </span>
          <span className="text-sm text-muted-foreground">/ {product.unit_ar}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          الأسعار تجريبية حاليًا ويتم تأكيدها عند إصدار الفاتورة.
        </p>
        <div className="mt-6 max-w-sm">
          <ProductCard product={product} />
        </div>
        <Button asChild variant="outline" className="mt-4">
          <a
            href={whatsappLink(settings?.sales_whatsapp ?? "", quoteMessage)}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            اطلب عرض سعر على واتساب
          </a>
        </Button>
      </div>
    </div>
  );
}
