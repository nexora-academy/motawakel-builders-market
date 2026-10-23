import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, MessageCircle, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { settingsQueryOptions } from "@/lib/queries";
import {
  getOrderWithCode,
  type CustomerOrder,
} from "@/lib/orders.functions";
import { createPayment, checkPayment } from "@/lib/moyasar.functions";
import {
  DEFAULT_SALES_WHATSAPP,
  formatSAR,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  whatsappLink,
} from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const invoiceSearchSchema = z.object({
  code: z.string().optional(),
});

export const Route = createFileRoute("/invoice/$orderId")({
  validateSearch: invoiceSearchSchema,
  component: InvoicePage,
  head: () => ({
    meta: [
      { title: "الفاتورة | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content: "فاتورة الطلب من مؤسسة المتوكل للتجارة — الأغراض والكميات والإجمالي.",
      },
      { property: "og:title", content: "الفاتورة | مؤسسة المتوكل للتجارة" },
      {
        property: "og:description",
        content: "فاتورة الطلب من مؤسسة المتوكل للتجارة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  notes: string | null;
  total: number;
  created_at: string;
  payment_id: string | null;
  order_items: {
    id: string;
    product_name_ar: string;
    specs_ar: string | null;
    unit_ar: string;
    quantity: number;
    unit_price: number;
  }[];
};

function mapRow(row: OrderRow): CustomerOrder {
  return {
    id: row.id,
    order_number: row.order_number,
    status: row.status,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_address: row.customer_address,
    notes: row.notes,
    total: Number(row.total),
    created_at: row.created_at,
    payment_id: row.payment_id,
    items: (row.order_items ?? []).map((it) => ({
      id: it.id,
      product_name_ar: it.product_name_ar,
      specs_ar: it.specs_ar,
      unit_ar: it.unit_ar,
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
    })),
  };
}

function InvoicePage() {
  const { orderId } = Route.useParams();
  const { code } = Route.useSearch();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [paying, setPaying] = useState(false);
  const { data: settings } = useQuery(settingsQueryOptions);

  const createPaymentFn = useServerFn(createPayment);
  const checkPaymentFn = useServerFn(checkPayment);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      let found: CustomerOrder | null = null;
      if (data.user) {
        const res = await supabase
          .from("orders")
          .select(
            "id, order_number, status, customer_name, customer_phone, customer_address, notes, total, created_at, payment_id, order_items(id, product_name_ar, specs_ar, unit_ar, quantity, unit_price)",
          )
          .eq("id", orderId)
          .maybeSingle();
        if (res.data) found = mapRow(res.data as unknown as OrderRow);
      }
      if (!active) return;
      if (!found && code) {
        try {
          found = await getOrderWithCode({
            data: { orderId, accessCode: code },
          });
        } catch {
          found = null;
        }
      }
      if (!active) return;
      if (found) {
        setOrder(found);
        setState("ready");
      } else {
        setState("missing");
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId, code]);

  // التحقق من الدفع بعد الرجوع من صفحة Moyasar أو عند وجود عملية دفع
  useEffect(() => {
    if (!order || !code || !order.payment_id || order.status === "paid") return;
    let active = true;
    void (async () => {
      try {
        const res = await checkPaymentFn({
          data: { orderId: order.id, accessCode: code },
        });
        if (!active) return;
        if (res.status === "paid" && order.status !== "paid") {
          setOrder({ ...order, status: "paid" });
          toast.success("تم استلام الدفع بنجاح");
        }
      } catch {
        // تجاهل — الحالة تتحدث لاحقًا
      }
    })();
    return () => {
      active = false;
    };
  }, [order, code, checkPaymentFn]);

  async function handlePay() {
    if (!order || !code) return;
    setPaying(true);
    try {
      const res = await createPaymentFn({
        data: { orderId: order.id, accessCode: code },
      });
      if (!res.configured) {
        toast.info("الدفع الإلكتروني لم يتفعل بعد — تواصل مع المبيعات على واتساب");
        return;
      }
      if (res.url) {
        window.location.href = res.url;
      } else {
        toast.info("الطلب مدفوع بالفعل");
      }
    } catch {
      toast.error("تعذر إنشاء عملية الدفع، جرب تاني");
    } finally {
      setPaying(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "missing" || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">الفاتورة غير موجودة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          الرابط غير صحيح أو ناقص رمز التحقق. لو وصلك رابط الفاتورة من المسؤول
          استخدمه كما هو.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">الرئيسية</Link>
        </Button>
      </div>
    );
  }

  const canPay =
    code !== undefined &&
    (order.status === "new" ||
      order.status === "processing" ||
      order.status === "awaiting_payment");

  const waMessage = [
    `طلب رقم ${order.order_number}`,
    ...order.items.map(
      (it) =>
        `• ${it.product_name_ar}${it.specs_ar ? ` (${it.specs_ar})` : ""} — ${it.quantity} ${it.unit_ar} — ${formatSAR(it.quantity * it.unit_price)}`,
    ),
    `الإجمالي: ${formatSAR(order.total)}`,
  ].join("\n");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">
            الفاتورة {order.order_number}
          </h1>
          <Badge
            className={`mt-1 ${ORDER_STATUS_STYLES[order.status] ?? ""}`}
            variant="secondary"
          >
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPay && (
            <Button onClick={() => void handlePay()} disabled={paying}>
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              ادفع إلكترونيًا
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            تحميل PDF / طباعة
          </Button>
          <Button variant="outline" asChild>
            <a
              href={whatsappLink(settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP, waMessage)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              واتساب المبيعات
            </a>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display text-lg font-bold">
                م
              </span>
              <div>
                <h2 className="font-display text-xl font-bold">
                  {settings?.["store_name"] ?? "مؤسسة المتوكل للتجارة"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  مواد بناء وعوازل
                </p>
              </div>
            </div>
          </div>
          <div className="text-left text-sm">
            <p>
              <span className="text-muted-foreground">رقم الطلب: </span>
              <b>{order.order_number}</b>
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">التاريخ: </span>
              {new Date(order.created_at).toLocaleDateString("ar-EG")}
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">الحالة: </span>
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </p>
          </div>
        </div>

        <div className="grid gap-4 border-b py-6 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">العميل</p>
            <p className="font-bold">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">الجوال</p>
            <p dir="ltr" className="font-bold">
              {order.customer_phone}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">العنوان / الموقع</p>
            <p className="font-bold">{order.customer_address || "—"}</p>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b text-right text-muted-foreground">
              <th className="pb-2 font-medium">الغرض</th>
              <th className="pb-2 font-medium">الكمية</th>
              <th className="pb-2 font-medium">سعر الوحدة</th>
              <th className="pb-2 text-left font-medium">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((it) => (
              <tr key={it.id}>
                <td className="py-3">
                  <p className="font-bold">{it.product_name_ar}</p>
                  {it.specs_ar && (
                    <p className="text-xs text-muted-foreground">{it.specs_ar}</p>
                  )}
                </td>
                <td className="py-3">
                  {it.quantity} {it.unit_ar}
                </td>
                <td className="py-3">{formatSAR(it.unit_price)}</td>
                <td className="py-3 text-left font-bold">
                  {formatSAR(it.quantity * it.unit_price)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td colSpan={3} className="pt-4 font-display text-lg font-bold">
                الإجمالي
              </td>
              <td className="pt-4 text-left font-display text-xl font-bold">
                {formatSAR(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {order.notes && (
          <div className="mt-6 rounded-xl bg-muted p-4 text-sm">
            <p className="font-bold">ملاحظات</p>
            <p className="mt-1 whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        <p className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground">
          شكرًا لتعاملك مع مؤسسة المتوكل للتجارة — هذه الفاتورة صادرة إلكترونيًا.
        </p>
      </div>
    </div>
  );
}
