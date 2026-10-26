import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  qty: z.number().positive().max(100000),
});

const toLatinDigits = (v: string) =>
  v.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, "السلة فارغة").max(100),
  company: z
    .string()
    .trim()
    .min(2, "اكتب اسم الشركة أو المؤسسة")
    .max(120, "اسم الشركة طويل جدًا"),
  vat: z
    .string()
    .trim()
    .transform(toLatinDigits)
    .refine((v) => v === "" || /^\d{15}$/.test(v), "الرقم الضريبي لازم يكون 15 رقم")
    .optional(),
  nationalAddress: z
    .string()
    .trim()
    .min(5, "اكتب العنوان الوطني")
    .max(250, "العنوان الوطني طويل جدًا"),
  name: z.string().trim().min(2, "اسم المسؤول قصير جدًا").max(80),
  phone: z
    .string()
    .trim()
    .transform(toLatinDigits)
    .pipe(z.string().regex(/^\+?\d{9,15}$/, "رقم التواصل غير صحيح")),
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
