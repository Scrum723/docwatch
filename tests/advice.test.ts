import { describe, expect, it } from "vitest";
import { evaluateDockAdvice } from "../src/services/advice.js";
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

describe("evaluateDockAdvice (shipped rules)", () => {
  it("flags freeze when temp ≤ 36°F and recommends pull/cover/lines for boat", () => {
    const result = evaluateDockAdvice({
      locationName: "Rochester / Long Pond",
      asset: "boat",
      conditions: conditions({ temperatureF: 34 }),
      forecast: forecast([]),
      alerts: [],
    });
    expect(result.risks.some((r) => r.type === "freeze")).toBe(true);
    expect(result.actions).toEqual(
      expect.arrayContaining(["pull small craft", "cover dock", "add lines", "watch freeze"])
    );
    expect(result.human).toMatch(/freeze/i);
    expect(result.summary).toBeTruthy();
  });

  it("flags wind when gusts ≥ 25 mph and moves van from trees", () => {
    const result = evaluateDockAdvice({
      locationName: "Fairport",
      asset: "van",
      conditions: conditions({ windGustMph: 28, temperatureF: 55 }),
      forecast: forecast([]),
      alerts: [],
    });
    expect(result.risks.some((r) => r.type === "wind")).toBe(true);
    expect(result.actions).toContain("move van from trees");
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
    const result = evaluateDockAdvice({
      locationName: "Rochester",
      asset: "dock",
      conditions: conditions({ temperatureF: 60 }),
      forecast: forecast([]),
      alerts,
    });
    expect(result.risks.some((r) => r.type === "flood")).toBe(true);
    expect(result.actions).toEqual(expect.arrayContaining(["watch flood", "add lines"]));
  });

  it("flags freeze from NWS freeze alert even if temp is mild", () => {
    const alerts: NwsAlert[] = [
      {
        id: "2",
        event: "Freeze Warning",
        headline: "Freeze Warning",
        severity: "Moderate",
        urgency: "Expected",
        certainty: "Likely",
        description: "Sub-freezing",
        instruction: "Protect pipes",
        areaDesc: "Monroe",
      },
    ];
    const result = evaluateDockAdvice({
      locationName: "Long Pond",
      asset: "home",
      conditions: conditions({ temperatureF: 42 }),
      forecast: forecast([]),
      alerts,
    });
    expect(result.risks.some((r) => r.type === "freeze")).toBe(true);
  });
});
