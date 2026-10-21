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
  name: string;
  specs: string | null;
  unit: string;
  price: number;
  qty: number;
};

const CART_KEY = "mutawakkil-cart-v1";

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  total: number;
  add: (item: Omit<CartItem, "qty">, qty: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
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
      const existing = prev.find((it) => it.productId === item.productId);
      if (existing) {
        return prev.map((it) =>
          it.productId === item.productId
            ? { ...it, qty: Math.min(it.qty + qty, 100000) }
            : it,
        );
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((it) => it.productId !== productId)
        : prev.map((it) =>
            it.productId === productId ? { ...it, qty: Math.min(qty, 100000) } : it,
          ),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
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
