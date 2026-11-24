import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { makePublicClient } from "./public-client";
import type { CustomerOrder } from "./orders.functions";

const MOYASAR_API = "https://api.moyasar.com/v1";

const paymentInput = z.object({
  orderId: z.string().uuid(),
  accessCode: z.string().min(8).max(64),
});

function authHeader(key: string): string {
  return `Basic ${btoa(key + ":")}`;
}

/**
 * إنشاء فاتورة دفع على Moyasar وتحويل العميل لصفحة الدفع المستضافة.
 * المفتاح سِرّي ويُقرأ داخل الـ handler فقط. لما المفتاح مش مضاف بعد
 * نرجع configured=false بدل ما نكسر الواجهة.
 */
export const createPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => paymentInput.parse(input))
  .handler(async ({ data }): Promise<{ configured: boolean; url?: string }> => {
    const key = process.env["MOYASAR_API_KEY"];
    if (!key) return { configured: false };

    const supabase = makePublicClient();
    const { data: row } = await supabase.rpc("get_order_customer", {
      _order_id: data.orderId,
      _access_code: data.accessCode,
    });
    if (!row) throw new Error("ORDER_NOT_FOUND");
    const order = row as unknown as CustomerOrder;
    if (order.status === "paid" || order.status === "delivered") {
      return { configured: true };
    }

    const amount = Math.round(Number(order.total) * 100);
    if (amount < 100) throw new Error("AMOUNT_TOO_LOW");

    const request = getRequest();
    const origin = new URL(request.url).origin;
    const successUrl = `${origin}/invoice/${data.orderId}?code=${data.accessCode}`;

    const res = await fetch(`${MOYASAR_API}/invoices`, {
      method: "POST",
      headers: {
        Authorization: authHeader(key),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "SAR",
        description: `فاتورة الطلب ${order.order_number}`,
        success_url: successUrl,
      }),
    });
    if (!res.ok) throw new Error("MOYASAR_ERROR");
    const invoice = (await res.json()) as { id: string; url: string };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("set_payment_id", {
      _order_id: data.orderId,
      _access_code: data.accessCode,
      _payment_id: invoice.id,
    });
    return { configured: true, url: invoice.url };
  });

/**
 * التحقق من حالة الدفع عند العودة من صفحة Moyasar.
 * الحالة تُؤخذ من Moyasar نفسه — لا يُعتمد على إجابات المتصفح.
 */
export const checkPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => paymentInput.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{ checked: boolean; status: string | null }> => {
      const key = process.env["MOYASAR_API_KEY"];
      const supabase = makePublicClient();
      const { data: row } = await supabase.rpc("get_order_customer", {
        _order_id: data.orderId,
        _access_code: data.accessCode,
      });
      if (!row) return { checked: false, status: null };
      const order = row as unknown as CustomerOrder;
      if (order.status === "paid") return { checked: true, status: "paid" };
      if (!key || !order.payment_id) return { checked: true, status: order.status };

      const res = await fetch(`${MOYASAR_API}/invoices/${order.payment_id}`, {
        headers: { Authorization: authHeader(key) },
      });
      if (!res.ok) return { checked: true, status: order.status };
      const invoice = (await res.json()) as { status: string };
      if (invoice.status === "paid") {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.rpc("set_order_paid", {
          _order_id: data.orderId,
          _access_code: data.accessCode,
        });
        return { checked: true, status: "paid" };
      }
      return { checked: true, status: order.status };
    },
  );
