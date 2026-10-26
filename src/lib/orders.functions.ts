import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createOrderSchema,
  type CreateOrderInput,
} from "./schemas";
import { makePublicClient } from "./public-client";
import type { OrderStatus } from "./format";

export type CustomerOrderItem = {
  id: string;
  product_name_ar: string;
  specs_ar: string | null;
  unit_ar: string;
  quantity: number;
  unit_price: number;
};

export type CustomerOrder = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  notes: string | null;
  total: number;
  /** نسبة ضريبة القيمة المضافة وقت الطلب (0.15) */
  vat_rate: number;
  created_at: string;
  payment_id: string | null;
  company_name: string | null;
  vat_number: string | null;
  national_address: string | null;
  items: CustomerOrderItem[];
};

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createOrderSchema.parse(input))
  .handler(async ({ data }: { data: CreateOrderInput }) => {
    const supabase = makePublicClient();
    const { data: result, error } = await supabase.rpc("create_order", {
      _items: data.items.map((it) => ({ productId: it.productId, qty: it.qty })),
      _name: data.name,
      _phone: data.phone,
      _address: data.address || null,
      _notes: data.notes || null,
      _user_id: null,
      _company: data.company,
      _vat: data.vat || null,
      _national_address: data.nationalAddress,
    });
    if (error || !result || result.length === 0) {
      throw new Error("ORDER_CREATE_FAILED");
    }
    const row = result[0];
    return {
      orderId: row.order_id,
      orderNumber: row.order_number,
      accessCode: row.access_code,
      total: Number(row.total),
    };
  });

export const linkOrderToUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; accessCode: string }) => input)
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    const { error } = await context.supabase.rpc("link_order_to_user", {
      _order_id: data.orderId,
      _access_code: data.accessCode,
    });
    return { ok: !error };
  });

export const getOrderWithCode = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string; accessCode: string }) => input)
  .handler(async ({ data }): Promise<CustomerOrder | null> => {
    const supabase = makePublicClient();
    const { data: row, error } = await supabase.rpc("get_order_customer", {
      _order_id: data.orderId,
      _access_code: data.accessCode,
    });
    if (error || !row) return null;
    const parsed = row as unknown as CustomerOrder;
    parsed.items = (parsed.items ?? []).map((it) => ({
      ...it,
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
    }));
    parsed.total = Number(parsed.total);
    parsed.vat_rate = Number(parsed.vat_rate ?? 0.15);
    return parsed;
  });

export const markOrderPaid = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string; accessCode: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const supabase = makePublicClient();
    const { error } = await supabase.rpc("set_order_paid", {
      _order_id: data.orderId,
      _access_code: data.accessCode,
    });
    return { ok: !error };
  });

export type { OrderStatus };
