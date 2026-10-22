import { describe, it, expect } from "vitest";
import { resolveLocation, UnknownLocationError } from "../src/services/locations.js";
import { describeObsTime } from "../src/tools/get_current_conditions.js";
describe("locations", () => {
  it("resolves Rochester and Buffalo", () => {
    expect(resolveLocation({ location: "Rochester NY" }).key).toBe("rochester");
    expect(resolveLocation({ location: "Buffalo NY" }).key).toBe("buffalo");
  });
  it("defaults when no location given", () => expect(resolveLocation({}).key).toBeTruthy());
  it("rejects unknown places instead of silently substituting", () => {
    expect(() => resolveLocation({ location: "Atlantis" })).toThrow(UnknownLocationError);
  });
  it("flags stale observations", () => {
    expect(describeObsTime(new Date(Date.now() - 5 * 3600e3).toISOString())).toMatch(/stale/);
    expect(describeObsTime(undefined)).toMatch(/unknown/);
  });
});
