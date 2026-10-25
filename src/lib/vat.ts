// أسعار الأصناف قبل الضريبة — الفاتورة بتضيف ضريبة القيمة المضافة
export const VAT_RATE = 0.15;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type VatBreakdown = { subtotal: number; vat: number; total: number; rate: number };

export function vatBreakdown(subtotal: number, rate: number = VAT_RATE): VatBreakdown {
  const sub = round2(subtotal);
  const vat = round2(sub * rate);
  return { subtotal: sub, vat, total: round2(sub + vat), rate };
}

export function vatPercentLabel(rate: number = VAT_RATE): string {
  return `${Math.round(rate * 100)}%`;
}
