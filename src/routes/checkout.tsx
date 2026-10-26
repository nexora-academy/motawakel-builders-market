import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createOrder, linkOrderToUser } from "@/lib/orders.functions";
import { createOrderSchema } from "@/lib/schemas";
import { settingsQueryOptions } from "@/lib/queries";
import { cartLineKey, useCart } from "@/lib/cart";
import {
  DEFAULT_SALES_WHATSAPP,
  formatSAR,
  orderNoticeMessage,
  whatsappLink,
} from "@/lib/format";
import { vatBreakdown } from "@/lib/vat";
import { VatSummary } from "@/components/vat-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "إتمام الشراء | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content:
          "اكتب بيانات شركتك والرقم الضريبي والعنوان الوطني وأكّد الطلب لمؤسسة المتوكل للتجارة.",
      },
      { property: "og:title", content: "إتمام الشراء | مؤسسة المتوكل للتجارة" },
      {
        property: "og:description",
        content: "أكمل بيانات الفاتورة وأكّد طلبك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const DRAFT_KEY = "mutawakkil-billing-v1";

type Billing = {
  company: string;
  vat: string;
  nationalAddress: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
};

const EMPTY: Billing = {
  company: "",
  vat: "",
  nationalAddress: "",
  name: "",
  phone: "",
  address: "",
  notes: "",
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, hydrated, clear } = useCart();
  const { data: settings } = useQuery(settingsQueryOptions);
  const [form, setForm] = useState<Billing>(EMPTY);
  const [signedIn, setSignedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const salesWa = settings?.["sales_whatsapp"] ?? DEFAULT_SALES_WHATSAPP;
  const createOrderFn = useServerFn(createOrder);
  const linkOrderFn = useServerFn(linkOrderToUser);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    // نفتكر بيانات الشركة للطلبات الجاية
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Billing>;
        setForm((f) => ({ ...f, ...saved, notes: "", address: saved.address ?? "" }));
      }
    } catch {
      // تجاهل
    }
  }, []);

  const set = (key: keyof Billing) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  if (hydrated && items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">سلتك فاضية</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          أضف أغراض للسلة الأول قبل إتمام الشراء.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">ابدأ التسوق</Link>
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createOrderSchema.safeParse({
      items: items.map((it) => ({
        productId: it.productId,
        variantId: it.variantId ?? null,
        qty: it.qty,
      })),
      ...form,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "راجع البيانات المدخلة");
      return;
    }
    // نفتح نافذة واتساب فورًا مع الضغطة (عشان المتصفح ما يمنعهاش) ونحط الرابط بعد حفظ الطلب
    const waWindow = window.open("", "_blank");
    setSubmitting(true);
    try {
      const result = await createOrderFn({ data: parsed.data });
      const snapshot = [...items];
      clear();
      try {
        const { notes: _n, ...keep } = form;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(keep));
      } catch {
        // تجاهل
      }
      if (signedIn) {
        try {
          await linkOrderFn({
            data: { orderId: result.orderId, accessCode: result.accessCode },
          });
        } catch {
          // الطلب محفوظ كضيف
        }
      }
      const invoiceUrl = `${window.location.origin}/invoice/${result.orderId}?code=${result.accessCode}`;
      const noticeTotals = vatBreakdown(snapshot.reduce((s, it) => s + it.qty * it.price, 0));
      const message = orderNoticeMessage({
        orderNumber: result.orderNumber,
        company: parsed.data.company,
        vat: parsed.data.vat ?? null,
        nationalAddress: parsed.data.nationalAddress,
        name: parsed.data.name,
        phone: parsed.data.phone,
        items: snapshot.map((it) => ({
          name: it.name,
          specs: it.specs,
          qty: it.qty,
          unit: it.unit,
          lineTotal: it.qty * it.price,
        })),
        subtotal: noticeTotals.subtotal,
        vatAmount: noticeTotals.vat,
        total: result.total,
        invoiceUrl,
      });
      const waUrl = whatsappLink(salesWa, message);
      let opened = false;
      if (waWindow && !waWindow.closed) {
        waWindow.location.href = waUrl;
        opened = true;
      }
      toast.success(`تم تأكيد الطلب ${result.orderNumber}`);
      await navigate({
        to: "/invoice/$orderId",
        params: { orderId: result.orderId },
        search: { code: result.accessCode, notify: opened ? "sent" : "pending" },
      });
    } catch {
      waWindow?.close();
      toast.error("حصلت مشكلة في إرسال الطلب، جرب تاني");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">إتمام الشراء</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        اكتب بيانات الفاتورة — أول ما تأكد الطلب بيوصل لمسؤول المبيعات على واتساب
        مباشرة.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="shadow-3d lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display">بيانات الفاتورة</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="company">اسم الشركة / المؤسسة *</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={set("company")}
                  required
                  maxLength={120}
                  placeholder="مثال: شركة البناء الحديث للمقاولات"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="vat">الرقم الضريبي</Label>
                  <Input
                    id="vat"
                    value={form.vat}
                    onChange={set("vat")}
                    inputMode="numeric"
                    maxLength={15}
                    dir="ltr"
                    placeholder="3XXXXXXXXXXXXX3"
                  />
                  <p className="text-xs text-muted-foreground">15 رقم — اتركه فاضي لو مش مسجل</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">رقم التواصل (واتساب) *</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={set("phone")}
                    required
                    inputMode="tel"
                    maxLength={16}
                    dir="ltr"
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nationalAddress">العنوان الوطني *</Label>
                <Input
                  id="nationalAddress"
                  value={form.nationalAddress}
                  onChange={set("nationalAddress")}
                  required
                  maxLength={250}
                  placeholder="رقم المبنى، الشارع، الحي، المدينة، الرمز البريدي (أو الرمز المختصر)"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="name">اسم المسؤول *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={set("name")}
                    required
                    maxLength={80}
                    placeholder="الاسم بالكامل"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">موقع التسليم</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={set("address")}
                    maxLength={200}
                    placeholder="اسم المشروع أو رابط الموقع"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={set("notes")}
                  maxLength={500}
                  rows={3}
                  placeholder="أي تفاصيل إضافية تحب توضحها"
                />
              </div>
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                تأكيد الطلب وإرساله للمسؤول
              </Button>
              {signedIn && (
                <p className="text-center text-xs text-muted-foreground">
                  الطلب هيرتبط بحسابك وتقدر تتابعه من طلباتي.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit shadow-3d lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">ملخص السلة</CardTitle>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            {items.map((it) => (
              <div key={cartLineKey(it)} className="flex justify-between gap-2 py-2">
                <span className="min-w-0 truncate">
                  {it.name}
                  {it.specs ? ` — ${it.specs}` : ""}
                  <span className="text-muted-foreground">
                    {" "}
                    × {it.qty} {it.unit}
                  </span>
                </span>
                <span className="shrink-0 font-bold">{formatSAR(it.price * it.qty)}</span>
              </div>
            ))}
            <VatSummary subtotal={total} approximate />
            <p className="pb-1 text-xs text-muted-foreground">
              بعد التأكيد بتتفتح واتساب برسالة الطلب للمسؤول، وهو يراجع ويصدر الفاتورة
              النهائية، وبعدها تدفع إلكترونيًا.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
