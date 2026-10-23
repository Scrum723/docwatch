import { describe, expect, it } from "vitest";
import { evaluateDocAdvice, normalizeAsset } from "../src/services/advice.js";
import type { NwsAlert, NwsConditions, NwsForecast } from "../src/services/nws.js";

function conditions(partial: Partial<NwsConditions>): NwsConditions {
  return {
    source: "api.weather.gov",
    temperatureF: 50,
    humidityPct: 40,
    windMph: 5,
    windGustMph: 8,
    textDescription: "Clear",
    ...partial,
  };
}

function forecast(periods: NwsForecast["periods"]): NwsForecast {
  return { source: "api.weather.gov", periods, hoursRequested: 24 };
}

const coast = "Lake Ontario shoreline (North Greece / Charlotte / Braddock Bay)";

describe("evaluateDocAdvice (shipped rules)", () => {
  it("flags freeze when temp ≤ 36°F and recommends maritime actions", () => {
    const result = evaluateDocAdvice({
      locationName: "Rochester / Long Pond",
      nearestCoastline: coast,
      asset: "maritime",
      conditions: conditions({ temperatureF: 34 }),
      forecast: forecast([]),
      alerts: [],
    });
    expect(result.risks.some((r) => r.type === "freeze")).toBe(true);
    expect(result.actions).toEqual(
      expect.arrayContaining(["pull small craft", "secure shoreline gear", "add lines", "watch freeze"])
    );
    expect(result.human).toMatch(/coastal advisories/i);
    expect(result.human).toMatch(/Lake Ontario/i);
    expect(result.human).toMatch(/freeze/i);
    expect(result.summary).toMatch(/freeze/i);
  });

  it("uses quiet conversational copy when no elevated risks and cites coastline", () => {
    const result = evaluateDocAdvice({
      locationName: "Rochester / Long Pond",
      nearestCoastline: coast,
      asset: "home",
      conditions: conditions({ temperatureF: 52, windGustMph: 10 }),
      forecast: forecast([]),
      alerts: [],
    });
    expect(result.risks).toHaveLength(0);
    expect(result.human).toMatch(/look quiet/i);
    expect(result.human).toMatch(/nearest coastline/i);
    expect(result.human).toMatch(/national weather service/i);
    expect(result.human).not.toMatch(/[\u2013\u2014]/);
  });

  it("flags wind when gusts ≥ 25 mph and moves mobile vehicle from trees", () => {
    const result = evaluateDocAdvice({
      locationName: "Fairport",
      nearestCoastline: "Lake Ontario via Irondequoit Bay / Seabreeze corridor",
      asset: "mobile",
      conditions: conditions({ windGustMph: 28, temperatureF: 55 }),
      forecast: forecast([]),
      alerts: [],
    });
    expect(result.risks.some((r) => r.type === "wind")).toBe(true);
    expect(result.actions).toContain("move vehicle from trees");
  });

  it("flags flood from NWS flood alert", () => {
    const alerts: NwsAlert[] = [
      {
        id: "1",
        event: "Flood Warning",
        headline: "Flood Warning for Monroe",
        severity: "Severe",
        urgency: "Immediate",
        certainty: "Likely",
        description: "Flooding expected",
        instruction: "Move to higher ground",
        areaDesc: "Monroe, NY",
      },
    ];
    const result = evaluateDocAdvice({
      locationName: "Rochester",
      nearestCoastline: coast,
      asset: "maritime",
      conditions: conditions({ temperatureF: 60 }),
      forecast: forecast([]),
      alerts,
    });
    expect(result.risks.some((r) => r.type === "flood")).toBe(true);
    expect(result.actions).toEqual(expect.arrayContaining(["watch flood", "add lines"]));
  });

  it("flags coastal advisories from NWS marine/coastal events", () => {
    const alerts: NwsAlert[] = [
      {
        id: "3",
        event: "Small Craft Advisory",
        headline: "Small Craft Advisory for Lake Ontario",
        severity: "Moderate",
        urgency: "Expected",
        certainty: "Likely",
        description: "Winds and waves",
        instruction: "Mariners take caution",
        areaDesc: "Lake Ontario",
      },
    ];
    const result = evaluateDocAdvice({
      locationName: "Sodus Point",
      nearestCoastline: "Lake Ontario at Sodus Bay / Sodus Point",
      asset: "maritime",
      conditions: conditions({ temperatureF: 50 }),
      forecast: forecast([]),
      alerts,
    });
    expect(result.risks.some((r) => r.type === "coastal")).toBe(true);
    expect(result.human).toMatch(/Sodus/i);
    expect(result.actions).toEqual(expect.arrayContaining(["heed coastal advisories"]));
  });

  it("normalizes legacy asset names", () => {
    expect(normalizeAsset("boat")).toBe("maritime");
    expect(normalizeAsset("dock")).toBe("maritime");
    expect(normalizeAsset("van")).toBe("mobile");
    expect(normalizeAsset("Current location")).toBe("current_location");
  });
});
