import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("formats INR with symbol and two decimals", () => {
    expect(formatMoney(8000000, "INR")).toBe("₹8,000,000.00");
  });

  it("accepts the decimal strings the API sends", () => {
    expect(formatMoney("96000.0", "USD")).toBe("$96,000.00");
  });

  it("formats GBP", () => {
    expect(formatMoney("1234.5", "GBP")).toBe("£1,234.50");
  });
});
