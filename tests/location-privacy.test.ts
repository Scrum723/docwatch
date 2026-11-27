import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PRIVATE_PLACE = /\b(home|house|dock|docks|residence|backyard|porch|driveway|garage)\b/i;

describe("data/locations.json has no precise or private pins", () => {
  const data = JSON.parse(readFileSync(join(process.cwd(), "data", "locations.json"), "utf8"));
  for (const [key, loc] of Object.entries<Record<string, unknown>>(data.locations)) {
    it(`${key}: coords at most 2 decimals, no home/dock labels`, () => {
      for (const field of ["lat", "lon"]) {
        const v = String(loc[field]);
        expect((v.split(".")[1] || "").length, `${key}.${field}`).toBeLessThanOrEqual(2);
      }
      const words = [loc.name, loc.label, ...((loc.aliases as string[]) || [])].join(" | ");
      expect(PRIVATE_PLACE.test(words), words).toBe(false);
    });
  }
});
