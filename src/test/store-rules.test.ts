import { describe, expect, it } from "vitest";
import { PRODUCT_UNITS, normalizeUnit } from "@/lib/units";
import { createOrderSchema } from "@/lib/schemas";
import { parsePressure, parseSize, productsForPressure, isHordiPressure } from "@/lib/hordi";
import { DEFAULT_SALES_WHATSAPP, orderNoticeMessage, whatsappLink } from "@/lib/format";

const base = {
  items: [{ productId: "3f1c2a9e-1b2c-4d5e-8f90-123456789abc", qty: 2 }],
  company: "شركة البناء الحديث",
  nationalAddress: "8228 طريق الملك فهد، العليا، الرياض 12214",
  name: "أحمد",
  phone: "0551234567",
};

describe("checkout billing details", () => {
  it("requires the company name", () => {
    expect(createOrderSchema.safeParse({ ...base, company: "" }).success).toBe(false);
  });

  it("requires the national address", () => {
    expect(createOrderSchema.safeParse({ ...base, nationalAddress: "" }).success).toBe(false);
  });

  it("accepts an empty VAT number but rejects one that is not 15 digits", () => {
    expect(createOrderSchema.safeParse({ ...base, vat: "" }).success).toBe(true);
    expect(createOrderSchema.safeParse({ ...base, vat: "300000000000003" }).success).toBe(true);
    expect(createOrderSchema.safeParse({ ...base, vat: "12345" }).success).toBe(false);
  });

  it("requires a valid contact number", () => {
    expect(createOrderSchema.safeParse({ ...base, phone: "abc" }).success).toBe(false);
  });
});

describe("hordi pressure pages", () => {
  it("only the six pressures 8–18 have pages", () => {
    expect([8, 10, 12, 14, 16, 18].every(isHordiPressure)).toBe(true);
    expect(isHordiPressure(20)).toBe(false);
  });

  it("groups products by the pressure written in their specs", () => {
    const products = [
      { id: "a", name_ar: "هوردي 25×40×200", specs_ar: "ضغط 8" },
      { id: "b", name_ar: "هوردي 30×40×200", specs_ar: "ضغط 18" },
      { id: "c", name_ar: "هوردي 35×40×200", specs_ar: "ضغط ٨" },
    ];
    expect(productsForPressure(products, 8).map((p) => p.id)).toEqual(["a", "c"]);
    expect(parsePressure("ضغط 18")).toBe(18);
    expect(parseSize("هوردي \u200e40×40×200\u200e")).toBe("40×40×200");
  });
});

describe("order notice to sales on WhatsApp", () => {
  it("goes to the sales number 0501215513", () => {
    expect(whatsappLink(DEFAULT_SALES_WHATSAPP, "x")).toMatch(/^https:\/\/wa\.me\/966501215513\?/);
  });

  it("includes company, VAT number and national address", () => {
    const msg = orderNoticeMessage({
      orderNumber: "MTW-2026-00010",
      company: "شركة البناء الحديث",
      vat: "300000000000003",
      nationalAddress: "الرياض 12214",
      name: "أحمد",
      phone: "0551234567",
      items: [{ name: "هوردي", specs: "ضغط 8", qty: 10, unit: "متر", lineTotal: 7.5 }],
      subtotal: 7.5,
      vatAmount: 1.13,
      total: 8.63,
      invoiceUrl: "https://example.com/invoice/1",
    });
    expect(msg).toContain("شركة البناء الحديث");
    expect(msg).toContain("300000000000003");
    expect(msg).toContain("الرياض 12214");
    expect(msg).toContain("MTW-2026-00010");
  });
});

describe("admin product units", () => {
  it("offers cm, roll and carton as ready units", () => {
    expect(PRODUCT_UNITS).toContain("سم");
    expect(PRODUCT_UNITS).toContain("لفة");
    expect(PRODUCT_UNITS).toContain("كرتونة");
  });

  it("falls back to قطعة when the unit is left empty", () => {
    expect(normalizeUnit("  ")).toBe("قطعة");
    expect(normalizeUnit(" كرتونة ")).toBe("كرتونة");
  });
});

describe("prices before VAT, invoice with 15% VAT", () => {
  it("adds 15% VAT on top of the pre-tax subtotal", async () => {
    const { vatBreakdown, VAT_RATE } = await import("@/lib/vat");
    expect(VAT_RATE).toBe(0.15);
    expect(vatBreakdown(200)).toMatchObject({ subtotal: 200, vat: 30, total: 230 });
    expect(vatBreakdown(7.5)).toMatchObject({ vat: 1.13, total: 8.63 });
  });

  it("the WhatsApp order notice shows pre-tax, VAT and total with VAT", () => {
    const msg = orderNoticeMessage({
      orderNumber: "MTW-2026-00011",
      company: "شركة",
      nationalAddress: "الرياض",
      name: "أحمد",
      phone: "0551234567",
      items: [],
      subtotal: 200,
      vatAmount: 30,
      total: 230,
      invoiceUrl: "https://example.com",
    });
    expect(msg).toContain("الإجمالي قبل الضريبة: 200.00");
    expect(msg).toContain("ضريبة القيمة المضافة 15%: 30.00");
    expect(msg).toContain("الإجمالي شامل الضريبة: 230.00");
  });
});

describe("invoice barcode", () => {
  it("every Code 39 character has exactly 3 wide elements", async () => {
    const { CODE39_CHARS, code39Bars } = await import("@/lib/barcode");
    for (const c of CODE39_CHARS) {
      const { bars } = code39Bars(c === "*" ? "" : c);
      expect(bars.length).toBeGreaterThan(0);
    }
    const a = code39Bars("MTW-2026-00001");
    const b = code39Bars("MTW-2026-00002");
    expect(a.text).toBe("MTW-2026-00001");
    expect(a.bars).not.toEqual(b.bars);
  });
});

describe("product sizes with their own price", () => {
  it("each size of the same item is its own cart line", async () => {
    const { cartLineKey } = await import("@/lib/cart");
    expect(cartLineKey({ productId: "p", variantId: "a" })).not.toBe(
      cartLineKey({ productId: "p", variantId: "b" }),
    );
  });

  it("the cheapest size is the starting price and the size is written on the invoice line", async () => {
    const { startingPrice, variantSpecs } = await import("@/lib/variants");
    const variants = [
      { id: "1", product_id: "p", label_ar: "3 إنش", price: 12, in_stock: true },
      { id: "2", product_id: "p", label_ar: "2 إنش", price: 9, in_stock: true },
    ];
    expect(startingPrice({ price: 50, variants })).toBe(9);
    expect(startingPrice({ price: 50, variants: [] })).toBe(50);
    expect(variantSpecs("3 إنش", "مجلفن")).toBe("مقاس 3 إنش — مجلفن");
  });
});
