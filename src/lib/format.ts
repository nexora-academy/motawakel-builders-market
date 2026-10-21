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
