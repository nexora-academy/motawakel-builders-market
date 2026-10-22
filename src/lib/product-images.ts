import catTools from "@/assets/cat-tools.jpg";
import catInsulation from "@/assets/cat-insulation.jpg";
import catPlaster from "@/assets/cat-plaster.jpg";
import hordiPhoto from "@/assets/products/hordi.jpg.asset.json";

export const PRODUCT_IMAGE_BUCKET = "product-images";
// image_url اللي بيبدأ بالبادئة دي معناه ملف في المخزن الخاص
export const STORAGE_IMAGE_PREFIX = "storage:";

export const HORDI_IMAGE = hordiPhoto.url;

export const CATEGORY_IMAGES: Record<string, string> = {
  "tools-basics": catTools,
  "insulation-rolls": catInsulation,
  "plaster-tools": catPlaster,
  hordi: hordiPhoto.url,
};

export function productImage(
  imageUrl: string | null | undefined,
  categorySlug?: string,
): string {
  if (imageUrl && !imageUrl.startsWith(STORAGE_IMAGE_PREFIX)) return imageUrl;
  return (categorySlug && CATEGORY_IMAGES[categorySlug]) || catTools;
}
