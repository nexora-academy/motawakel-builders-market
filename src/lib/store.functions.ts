import { createServerFn } from "@tanstack/react-start";
import { makePublicClient } from "./public-client";
import { PRODUCT_IMAGE_BUCKET, STORAGE_IMAGE_PREFIX } from "./product-images";

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
  image_url: string | null;
};

export type Catalog = {
  categories: Category[];
  products: Product[];
};

const PRODUCT_COLUMNS =
  "id, category_id, name_ar, specs_ar, unit_ar, price, in_stock, image_url";

type PublicClient = ReturnType<typeof makePublicClient>;

// الصور المرفوعة من لوحة التحكم محفوظة في مخزن خاص — نحولها لروابط موقعة
async function resolveImages(supabase: PublicClient, products: Product[]) {
  const paths = products
    .map((p) => p.image_url)
    .filter((u): u is string => !!u && u.startsWith(STORAGE_IMAGE_PREFIX))
    .map((u) => u.slice(STORAGE_IMAGE_PREFIX.length));
  if (paths.length === 0) return products;
  const { data } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .createSignedUrls(paths, 60 * 60 * 24 * 7);
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map.set(row.path, row.signedUrl);
  }
  return products.map((p) => {
    if (!p.image_url?.startsWith(STORAGE_IMAGE_PREFIX)) return p;
    const path = p.image_url.slice(STORAGE_IMAGE_PREFIX.length);
    return { ...p, image_url: map.get(path) ?? null };
  });
}

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
        .select(PRODUCT_COLUMNS)
        .eq("is_active", true)
        .order("sort_order"),
    ]);
    const products = (prods.data ?? []).map((p) => ({
      ...p,
      price: Number(p.price),
    })) as Product[];
    return {
      categories: (cats.data ?? []) as Category[],
      products: await resolveImages(supabase, products),
    };
  },
);

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<Product | null> => {
    const supabase = makePublicClient();
    const { data: row } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("id", data.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!row) return null;
    const [resolved] = await resolveImages(supabase, [
      { ...(row as Product), price: Number(row.price) },
    ]);
    return resolved;
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
