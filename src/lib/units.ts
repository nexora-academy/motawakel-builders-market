// الوحدات الجاهزة اللي المسؤول يختار منها في لوحة التحكم — وفيه "وحدة تانية" لأي وحدة مش في القايمة
export const PRODUCT_UNITS = [
  "قطعة",
  "حبة",
  "سم",
  "متر",
  "لفة",
  "رول",
  "كرتونة",
  "كيس",
  "لوح",
  "كجم",
  "طن",
] as const;

export function normalizeUnit(value: string): string {
  const v = value.trim();
  return v.length > 0 ? v.slice(0, 20) : "قطعة";
}
