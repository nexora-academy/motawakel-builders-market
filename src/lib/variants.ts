import type { Product, ProductVariant } from "./store.functions";

/** نفس صياغة الفاتورة: "مقاس X — المواصفات" */
export function variantSpecs(label: string, specs: string | null | undefined): string {
  return [`مقاس ${label}`, specs?.trim() || null].filter(Boolean).join(" — ");
}

/** المقاس الافتراضي: أول مقاس متوفر، وإلا أول مقاس */
export function defaultVariant(variants: ProductVariant[]): ProductVariant | null {
  return variants.find((v) => v.in_stock) ?? variants[0] ?? null;
}

/** أقل سعر للصنف — لو له مقاسات بيبقى أرخص مقاس */
export function startingPrice(product: Pick<Product, "price" | "variants">): number {
  if (!product.variants?.length) return product.price;
  return Math.min(...product.variants.map((v) => v.price));
}
