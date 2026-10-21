import { describe, expect, it } from "vitest";
import { formatSAR, sanitizeNextPath, whatsappLink } from "@/lib/format";

describe("formatSAR", () => {
  it("formats prices with two decimals and SAR suffix", () => {
    expect(formatSAR(12.5)).toBe("12.50 ر.س");
    expect(formatSAR("0.75")).toBe("0.75 ر.س");
  });

  it("falls back to 0.00 for invalid values", () => {
    expect(formatSAR("abc")).toBe("0.00 ر.س");
  });
});

describe("sanitizeNextPath", () => {
  it("only allows same-origin relative paths", () => {
    expect(sanitizeNextPath("/account")).toBe("/account");
    expect(sanitizeNextPath("https://evil.com")).toBe("/");
    expect(sanitizeNextPath("//evil.com")).toBe("/");
    expect(sanitizeNextPath(null)).toBe("/");
  });
});

describe("whatsappLink", () => {
  it("strips non-digits from the phone number", () => {
    expect(whatsappLink("+966 5x 000", "hi")).toBe(
      `https://wa.me/9665000?text=${encodeURIComponent("hi")}`,
    );
  });
});
