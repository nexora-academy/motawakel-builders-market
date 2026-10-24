export const ORDER_STATUSES = [
  "new",
  "processing",
  "awaiting_payment",
  "paid",
  "delivered",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  processing: "قيد التحضير",
  awaiting_payment: "بانتظار الدفع",
  paid: "مدفوع",
  delivered: "تم التسليم",
};

export const ORDER_STATUS_STYLES: Record<string, string> = {
  new: "bg-secondary text-secondary-foreground",
  processing: "bg-chart-4/15 text-chart-4",
  awaiting_payment: "bg-accent/25 text-accent-foreground",
  paid: "bg-chart-3/15 text-chart-3",
  delivered: "bg-chart-3/25 text-chart-3",
};

export function formatSAR(value: number | string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0.00 ر.س";
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ر.س`;
}

export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

// 966501215513 → 0501215513 (عرض الرقم بالشكل المحلي السعودي)
export function localPhone(intl: string | null | undefined): string {
  const digits = (intl ?? "").replace(/[^\d]/g, "");
  if (digits.startsWith("966")) return `0${digits.slice(3)}`;
  return digits;
}

export const DEFAULT_SALES_WHATSAPP = "966501215513";

export type OrderNotice = {
  orderNumber: string;
  company: string;
  vat?: string | null;
  nationalAddress: string;
  name: string;
  phone: string;
  items: { name: string; specs?: string | null; qty: number; unit: string; lineTotal: number }[];
  total: number;
  invoiceUrl: string;
};

// رسالة إشعار الطلب الجديد اللي بتروح لواتساب المسؤول
export function orderNoticeMessage(o: OrderNotice): string {
  return [
    `طلب جديد رقم ${o.orderNumber}`,
    `الشركة: ${o.company}`,
    o.vat ? `الرقم الضريبي: ${o.vat}` : null,
    `العنوان الوطني: ${o.nationalAddress}`,
    `المسؤول: ${o.name} — ${o.phone}`,
    "",
    ...o.items.map(
      (it) =>
        `• ${it.name}${it.specs ? ` (${it.specs})` : ""} — ${it.qty} ${it.unit} — ${formatSAR(it.lineTotal)}`,
    ),
    "",
    `الإجمالي: ${formatSAR(o.total)}`,
    `الفاتورة: ${o.invoiceUrl}`,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}
