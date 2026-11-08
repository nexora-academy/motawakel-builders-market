import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { catalogQueryOptions } from "@/lib/queries";
import { getProduct } from "@/lib/store.functions";
import { productImage } from "@/lib/product-images";
import { ProductCard } from "@/components/product-card";
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
      context.queryClient.ensureQueryData(queryOptionsForProduct(params.id)),
    ]).then(([, product]) => {
      if (!product) throw notFound();
    }),
  component: ProductPage,
  head: () => ({
    meta: [
      { title: "تفاصيل المنتج | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content: "تفاصيل المنتج ومقاساته — اختار الكمية واطلب السعر على واتساب من مؤسسة المتوكل للتجارة.",
      },
      { property: "og:title", content: "تفاصيل المنتج | مؤسسة المتوكل للتجارة" },
      {
        property: "og:description",
        content: "اختار المقاس والكمية وكلم مسؤول المبيعات على واتساب.",
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

  if (!product) return null;
  const category = catalog.categories.find((c) => c.id === product.category_id);

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
        <Tilt className="h-fit overflow-hidden rounded-2xl border bg-card">
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
          {product.variants.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border">
              <p className="bg-secondary px-3 py-2 text-sm font-bold">المقاسات المتاحة</p>
              <ul className="divide-y text-sm">
                {product.variants.map((v) => (
                  <li key={v.id} className="flex justify-between px-3 py-2">
                    <span>مقاس {v.label_ar}</span>
                    {!v.in_stock && <span className="text-muted-foreground">غير متوفر</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            لمعرفة السعر والتوفر، اختار المقاس والكمية وابعت التفاصيل لمسؤول المبيعات على واتساب.
          </p>
          <div className="mt-6">
            <ProductCard product={product} categorySlug={category?.slug} />
          </div>
        </div>
      </div>
    </div>
  );
}
