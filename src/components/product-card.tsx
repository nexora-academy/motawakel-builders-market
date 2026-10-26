import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatSAR } from "@/lib/format";
import { productImage } from "@/lib/product-images";
import type { Product } from "@/lib/store.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tilt } from "@/components/tilt";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultVariant, variantSpecs } from "@/lib/variants";

export function ProductCard({
  product,
  categorySlug,
  title,
  subtitle,
}: {
  product: Product;
  categorySlug?: string | undefined;
  title?: string | undefined;
  subtitle?: string | null | undefined;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState<string | null>(
    () => defaultVariant(variants)?.id ?? null,
  );
  const variant = variants.find((v) => v.id === variantId) ?? null;
  const price = variant ? variant.price : product.price;
  const available = product.in_stock && (variant ? variant.in_stock : true);

  return (
    <Tilt max={6} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="relative block aspect-[4/3] overflow-hidden bg-secondary"
      >
        <img
          src={productImage(product.image_url, categorySlug)}
          alt={product.name_ar}
          loading="lazy"
          width={816}
          height={816}
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
        />
        {!product.in_stock && (
          <Badge variant="secondary" className="absolute right-2 top-2">
            غير متوفر حاليًا
          </Badge>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="font-display text-base font-bold leading-snug hover:underline"
        >
          {title ?? product.name_ar}
        </Link>
        {(subtitle ?? product.specs_ar) && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle ?? product.specs_ar}</p>
        )}

        {variants.length > 0 && (
          <div className="mt-3">
            <Select value={variantId ?? undefined} onValueChange={setVariantId}>
              <SelectTrigger aria-label="المقاس" className="h-9">
                <SelectValue placeholder="اختار المقاس" />
              </SelectTrigger>
              <SelectContent>
                {variants.map((v) => (
                  <SelectItem key={v.id} value={v.id} disabled={!v.in_stock}>
                    مقاس {v.label_ar} — {formatSAR(v.price)}
                    {!v.in_stock ? " (غير متوفر)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-2xl font-extrabold text-foreground">
            {formatSAR(price)}
          </span>
          <span className="text-xs text-muted-foreground">/ {product.unit_ar} · قبل الضريبة</span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <div className="flex items-center rounded-lg border">
            <button
              type="button"
              aria-label="زيادة الكمية"
              className="flex h-9 w-9 items-center justify-center rounded-l-lg hover:bg-muted"
              onClick={() => setQty((q) => Math.min(q + 1, 100000))}
            >
              <Plus className="h-4 w-4" />
            </button>
            <input
              aria-label="الكمية"
              inputMode="decimal"
              className="h-9 w-14 border-x bg-transparent text-center text-sm outline-none"
              value={qty}
              onChange={(e) => {
                const v = Number(e.target.value.replace(/[^\d.]/g, ""));
                setQty(Number.isFinite(v) ? Math.max(0, Math.min(v, 100000)) : 0);
              }}
            />
            <button
              type="button"
              aria-label="إنقاص الكمية"
              className="flex h-9 w-9 items-center justify-center rounded-r-lg hover:bg-muted"
              onClick={() => setQty((q) => Math.max(q - 1, 1))}
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
          <Button
            className="flex-1"
            disabled={!available || qty <= 0 || (variants.length > 0 && !variant)}
            onClick={() => {
              add(
                {
                  productId: product.id,
                  variantId: variant?.id ?? null,
                  name: product.name_ar,
                  specs: variant ? variantSpecs(variant.label_ar, product.specs_ar) : product.specs_ar,
                  unit: product.unit_ar,
                  price: Number(price),
                },
                qty,
              );
              toast.success(
                `تمت إضافة ${product.name_ar}${variant ? ` مقاس ${variant.label_ar}` : ""} للسلة`,
              );
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            أضف للسلة
          </Button>
        </div>
      </div>
    </Tilt>
  );
}
