import { describe, expect, it } from "vitest";
import { DEFAULT_SALES_WHATSAPP, productQuoteMessage, whatsappLink } from "@/lib/format";

describe("WhatsApp-only product enquiries", () => {
  it("includes the selected size and quantity without any price", () => {
    const message = productQuoteMessage({
      name: "مسمار",
      specs: "مقاس 4 إنش",
      qty: 3,
      unit: "كرتونة",
    });

    expect(message).toContain("مسمار (مقاس 4 إنش)");
    expect(message).toContain("الكمية: 3 كرتونة");
    expect(message).not.toContain("ر.س");
    expect(message).not.toContain("الإجمالي");
  });

  it("opens a ready message directly to sales on WhatsApp", () => {
    const href = whatsappLink(DEFAULT_SALES_WHATSAPP, productQuoteMessage({
      name: "سلك",
      specs: null,
      qty: 2,
      unit: "لفة",
    }));

    expect(href).toMatch(/^https:\/\/wa\.me\/966501215513\?text=/);
    expect(decodeURIComponent(href)).toContain("الكمية: 2 لفة");
  });
});
