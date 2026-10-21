import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createOrder, linkOrderToUser } from "@/lib/orders.functions";
import { createOrderSchema } from "@/lib/schemas";
import { useCart } from "@/lib/cart";
import { formatSAR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "إتمام الشراء | مؤسسة المتوكل للتجارة" },
      {
        name: "description",
        content: "أكمل بيانات الطلب وأرسله لمؤسسة المتوكل للتجارة لاستلام الفاتورة.",
      },
      { property: "og:title", content: "إتمام الشراء | مؤسسة المتوكل للتجارة" },
      {
        property: "og:description",
        content: "أكمل بيانات الطلب وأرسله لاستلام الفاتورة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, hydrated, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const createOrderFn = useServerFn(createOrder);
  const linkOrderFn = useServerFn(linkOrderToUser);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
  }, []);

  if (hydrated && items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">سلتك فاضية</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          أضف أغراض للسلة الأول قبل إتمام الشراء.
        </p>
        <Button asChild className="mt-6">
          <a href="/">ابدأ التسوق</a>
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = createOrderSchema.safeParse({
      items: items.map((it) => ({ productId: it.productId, qty: it.qty })),
      name,
      phone,
      address,
      notes,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "راجع البيانات المدخلة");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createOrderFn({ data: parsed.data });
      clear();
      if (signedIn) {
        try {
          await linkOrderFn({
            data: { orderId: result.orderId, accessCode: result.accessCode },
          });
        } catch {
          // الطلب محفوظ كضيف — مش مشكلة
        }
      }
      toast.success(`تم إرسال الطلب ${result.orderNumber}`);
      await navigate({
        to: "/invoice/$orderId",
        params: { orderId: result.orderId },
        search: { code: result.accessCode },
      });
    } catch {
      toast.error("حصلت مشكلة في إرسال الطلب، جرب تاني");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">إتمام الشراء</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {signedIn
          ? "أنت مسجل دخول — الطلب هيرتبط بحسابك وتقدر تتابعه من طلباتي."
          : "هنطلب منك بياناتك عشان المسؤول يصدر الفاتورة ويتواصل معاك."}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display">بيانات الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="name">الاسم *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={80}
                  placeholder="الاسم بالكامل"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">رقم الجوال (واتساب) *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  inputMode="tel"
                  maxLength={16}
                  placeholder="05xxxxxxxx"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">عنوان التسليم / الموقع</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={200}
                  placeholder="المدينة والحي واسم المشروع"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="أي تفاصيل إضافية تحب توضحها"
                />
              </div>
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                إرسال الطلب للمسؤول
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="font-display">ملخص السلة</CardTitle>
          </CardHeader>
          <CardContent className="divide-y text-sm">
            {items.map((it) => (
              <div key={it.productId} className="flex justify-between gap-2 py-2">
                <span className="min-w-0 truncate">
                  {it.name}
                  {it.specs ? ` — ${it.specs}` : ""}
                  <span className="text-muted-foreground">
                    {" "}
                    × {it.qty} {it.unit}
                  </span>
                </span>
                <span className="shrink-0 font-bold">
                  {formatSAR(it.price * it.qty)}
                </span>
              </div>
            ))}
            <div className="flex justify-between py-3 font-display text-base font-bold">
              <span>الإجمالي التقريبي</span>
              <span>{formatSAR(total)}</span>
            </div>
            <p className="pb-1 text-xs text-muted-foreground">
              بعد إرسال الطلب يراجعه المسؤول ويصدر لك الفاتورة النهائية، وبعدها
              تدفع إلكترونيًا أو تتابع مع المبيعات على واتساب.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
