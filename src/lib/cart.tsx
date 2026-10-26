import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  /** المقاس المختار لو الصنف له مقاسات */
  variantId?: string | null;
  name: string;
  specs: string | null;
  unit: string;
  price: number;
  qty: number;
};

const CART_KEY = "mutawakkil-cart-v1";

/** مفتاح السطر في السلة: الصنف + المقاس (كل مقاس سطر لوحده) */
export function cartLineKey(it: Pick<CartItem, "productId" | "variantId">): string {
  return `${it.productId}:${it.variantId ?? ""}`;
}

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  total: number;
  add: (item: Omit<CartItem, "qty">, qty: number) => void;
  setQty: (lineKey: string, qty: number) => void;
  remove: (lineKey: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it): it is CartItem =>
        typeof it?.productId === "string" &&
        typeof it?.name === "string" &&
        typeof it?.price === "number" &&
        typeof it?.qty === "number" &&
        it.qty > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty: number) => {
    setItems((prev) => {
      const key = cartLineKey(item);
      const existing = prev.find((it) => cartLineKey(it) === key);
      if (existing) {
        return prev.map((it) =>
          cartLineKey(it) === key
            ? { ...it, qty: Math.min(it.qty + qty, 100000) }
            : it,
        );
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const setQty = useCallback((lineKey: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((it) => cartLineKey(it) !== lineKey)
        : prev.map((it) =>
            cartLineKey(it) === lineKey ? { ...it, qty: Math.min(qty, 100000) } : it,
          ),
    );
  }, []);

  const remove = useCallback((lineKey: string) => {
    setItems((prev) => prev.filter((it) => cartLineKey(it) !== lineKey));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, it) => sum + it.qty, 0);
    const total = items.reduce((sum, it) => sum + it.qty * it.price, 0);
    return { items, hydrated, count, total, add, setQty, remove, clear };
  }, [items, hydrated, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
