import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().positive().max(100000),
});

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, "السلة فارغة").max(100),
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d{9,15}$/, "رقم الجوال غير صحيح"),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderResponseSchema = z.object({
  order_id: z.string().uuid(),
  order_number: z.string(),
  access_code: z.string(),
  total: z.number(),
});

export type OrderResponse = z.infer<typeof orderResponseSchema>;
