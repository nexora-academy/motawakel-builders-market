// تقسيم الهوردي حسب الضغط — الضغط مكتوب في مواصفات المنتج بصيغة "ضغط N"
export const HORDI_PRESSURES = [8, 10, 12, 14, 16, 18] as const;
export type HordiPressure = (typeof HORDI_PRESSURES)[number];

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

export function parsePressure(specs: string | null | undefined): number | null {
  if (!specs) return null;
  const m = normalizeDigits(specs).match(/ضغط\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

export function isHordiPressure(n: number): n is HordiPressure {
  return (HORDI_PRESSURES as readonly number[]).includes(n);
}

// يستخرج المقاس "25×40×200" من اسم المنتج
export function parseSize(name: string): string | null {
  const m = normalizeDigits(name).match(/(\d+)\s*[×xX*]\s*(\d+)\s*[×xX*]\s*(\d+)/);
  return m ? `${m[1]}×${m[2]}×${m[3]}` : null;
}

export function productsForPressure<T extends { specs_ar: string | null }>(
  products: T[],
  pressure: number,
): T[] {
  return products.filter((p) => parsePressure(p.specs_ar) === pressure);
}
