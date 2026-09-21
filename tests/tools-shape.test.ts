import { describe, expect, it } from "vitest";
import { runDescribeFeatures } from "../src/tools/describe_features.js";
import { runGetHomeSensors } from "../src/tools/get_home_sensors.js";
import { runSetWatch } from "../src/tools/set_watch.js";
import { TOOL_NAMES } from "../src/tools/index.js";
import { evaluateDockAdvice } from "../src/services/advice.js";
import { resolveLocation } from "../src/services/locations.js";
import { getMockHomeSensors } from "../src/services/ring.js";

describe("tool response shape + defaults", () => {
  it("exposes all eight exact tool names", () => {
    expect([...TOOL_NAMES].sort()).toEqual(
      [
        "describe_features",
        "get_alerts",
        "get_current_conditions",
        "get_dock_advice",
        "get_forecast",
        "get_home_sensors",
        "get_spoken_briefing",
        "set_watch",
      ].sort()
    );
  });

  it("defaults location to Rochester / Long Pond area", () => {
    const loc = resolveLocation({});
    expect(loc.lat).toBeCloseTo(43.255, 2);
    expect(loc.lon).toBeCloseTo(-77.685, 2);
    expect(loc.label.toLowerCase()).toMatch(/rochester|long pond|greece/);
  });

  it("describe_features returns human string + mesh/join content", async () => {
    const result = await runDescribeFeatures({ topic: "all" });
    const human = result.structuredContent?.human as string;
    expect(human).toMatch(/mesh/i);
    expect(human).toMatch(/join/i);
    expect(human).toMatch(/flood/i);
    expect(result.content?.[0]?.text).toBeTruthy();
  });

  it("get_home_sensors labels mock mode", async () => {
    process.env.MOCK_RING = "true";
    const result = await runGetHomeSensors({ location: "rochester" });
    const data = result.structuredContent as any;
    expect(data.mode).toBe("mock");
    expect(data.labeled).toMatch(/MOCK/i);
    expect(data.human).toMatch(/MOCK/i);
    expect(Array.isArray(data.sensors)).toBe(true);
    expect(data.sensors.every((s: any) => s.mock === true)).toBe(true);
    expect(data.sensors.some((s: any) => s.type === "motion_camera")).toBe(true);
  });

  it("set_watch records thresholds and returns human + json", async () => {
    const result = await runSetWatch({
      location: "rochester",
      windMph: 25,
      freezeTempF: 36,
      flood: true,
    });
    const data = result.structuredContent as any;
    expect(data.human).toMatch(/Watch set/i);
    expect(data.watch.thresholds.windMph).toBe(25);
    expect(data.watch.thresholds.freezeTempF).toBe(36);
  });

  it("mock ring helper never treats cameras as weather instruments", () => {
    const mock = getMockHomeSensors("Rochester");
    const cam = mock.sensors.find((s) => s.type === "motion_camera");
    expect(cam?.note).toMatch(/NOT a weather instrument/i);
  });

  it("advice helper returns structured risks/actions and human string", () => {
    const advice = evaluateDockAdvice({
      locationName: "Rochester",
      asset: "dock",
      conditions: {
        source: "api.weather.gov",
        temperatureF: 30,
        humidityPct: 70,
        windMph: 20,
        windGustMph: 30,
        textDescription: "Snow",
      },
      forecast: { source: "api.weather.gov", periods: [], hoursRequested: 24 },
      alerts: [],
    });
    expect(advice.human.length).toBeGreaterThan(10);
    expect(advice.actions.length).toBeGreaterThan(0);
    expect(advice.risks.length).toBeGreaterThan(0);
  });
});
