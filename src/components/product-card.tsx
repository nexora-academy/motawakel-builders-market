import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatSAR } from "@/lib/format";
import type { Product } from "@/lib/store.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            to="/product/$id"
            params={{ id: product.id }}
            className="font-display text-base font-bold leading-snug hover:underline"
          >
            {product.name_ar}
          </Link>
          {product.specs_ar && (
            <p className="mt-0.5 text-sm text-muted-foreground">{product.specs_ar}</p>
          )}
        </div>
        {!product.in_stock && (
          <Badge variant="secondary" className="shrink-0">
            غير متوفر حاليًا
          </Badge>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-xl font-bold text-foreground">
          {formatSAR(product.price)}
        </span>
        <span className="text-xs text-muted-foreground">/ {product.unit_ar}</span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex items-center rounded-lg border">
          <button
            type="button"
            aria-label="زيادة الكمية"
            className="flex h-9 w-9 items-center justify-center rounded-l-lg hover:bg-muted disabled:opacity-40"
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
            className="flex h-9 w-9 items-center justify-center rounded-r-lg hover:bg-muted disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(q - 1, 1))}
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
        <Button
          className="flex-1"
          disabled={!product.in_stock || qty <= 0}
          onClick={() => {
            add(
              {
                productId: product.id,
                name: product.name_ar,
                specs: product.specs_ar,
                unit: product.unit_ar,
                price: Number(product.price),
              },
              qty,
            );
            toast.success(`تمت إضافة ${product.name_ar} للسلة`);
          }}
        >
          <ShoppingCart className="h-4 w-4" />
          أضف للسلة
        </Button>
      </div>
    </div>
  );
}
