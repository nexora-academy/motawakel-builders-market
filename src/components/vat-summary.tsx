import { formatSAR } from "@/lib/format";
import { vatBreakdown, vatPercentLabel } from "@/lib/vat";

/** ملخص الإجمالي: قبل الضريبة + ضريبة القيمة المضافة + الإجمالي شامل الضريبة */
export function VatSummary({ subtotal, approximate = false }: { subtotal: number; approximate?: boolean }) {
  const b = vatBreakdown(subtotal);
  return (
    <div className="space-y-1 py-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">الإجمالي قبل الضريبة</span>
        <span>{formatSAR(b.subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">ضريبة القيمة المضافة ({vatPercentLabel(b.rate)})</span>
        <span>{formatSAR(b.vat)}</span>
      </div>
      <div className="flex items-center justify-between pt-1">
        <span className="font-display text-lg font-bold">
          {approximate ? "الإجمالي التقريبي شامل الضريبة" : "الإجمالي شامل الضريبة"}
        </span>
        <span className="font-display text-2xl font-bold">{formatSAR(b.total)}</span>
      </div>
    </div>
  );
}
