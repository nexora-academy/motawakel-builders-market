import { createServerFn } from "@tanstack/react-start";
import { makePublicClient } from "./public-client";

export type Category = {
  id: string;
  slug: string;
  name_ar: string;
  description_ar: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string;
  name_ar: string;
  specs_ar: string | null;
  unit_ar: string;
  price: number;
  in_stock: boolean;
};

export type Catalog = {
  categories: Category[];
  products: Product[];
};

export const getCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<Catalog> => {
    const supabase = makePublicClient();
    const [cats, prods] = await Promise.all([
      supabase
        .from("categories")
        .select("id, slug, name_ar, description_ar, sort_order")
        .order("sort_order"),
      supabase
        .from("products")
        .select("id, category_id, name_ar, specs_ar, unit_ar, price, in_stock")
        .eq("is_active", true)
        .order("sort_order"),
    ]);
    return {
      categories: (cats.data ?? []) as Category[],
      products: (prods.data ?? []) as Product[],
    };
  },
);

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<Product | null> => {
    const supabase = makePublicClient();
    const { data: row } = await supabase
      .from("products")
      .select("id, category_id, name_ar, specs_ar, unit_ar, price, in_stock")
      .eq("id", data.id)
      .eq("is_active", true)
      .maybeSingle();
    return (row as Product) ?? null;
  });

export const getSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<string, string>> => {
    const supabase = makePublicClient();
    const { data } = await supabase.from("app_settings").select("key, value");
    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return map;
  },
);
