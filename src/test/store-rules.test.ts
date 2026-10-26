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
