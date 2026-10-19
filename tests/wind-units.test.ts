import { describe, it, expect } from "vitest";
import { speedToMph } from "../src/services/nws.js";

describe("speedToMph", () => {
  it("converts NWS km/h to mph", () => {
    expect(speedToMph({ value: 20.52, unitCode: "wmoUnit:km_h-1" })).toBe(12.8);
  });
  it("still handles m/s", () => {
    expect(speedToMph({ value: 10, unitCode: "wmoUnit:m_s-1" })).toBe(22.4);
  });
  it("returns null for missing values", () => {
    expect(speedToMph({ value: null, unitCode: "wmoUnit:km_h-1" })).toBeNull();
  });
});
