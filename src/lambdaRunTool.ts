/**
 * Tool dispatcher for Lambda / lightweight MCP (no MCP SDK registerTool).
 */
import { runGetAlerts } from "./tools/get_alerts.js";
import { runGetCurrentConditions } from "./tools/get_current_conditions.js";
import { runDescribeFeatures } from "./tools/describe_features.js";
import { runGetDocAdvice } from "./tools/get_DOC_advice.js";
import { runGetForecast } from "./tools/get_forecast.js";
import { runGetHomeSensors } from "./tools/get_home_sensors.js";
import { runGetSpokenBriefing } from "./tools/get_spoken_briefing.js";
import { runSetWatch } from "./tools/set_watch.js";
import { TOOL_NAMES } from "./tools/index.js";

export { TOOL_NAMES };

const locationProps = {
  city: { type: "string", description: "City name; defaults to Rochester / North Greece / Long Pond" },
  location: { type: "string", description: "Location key or alias" },
  lat: { type: "number", description: "Latitude" },
  lon: { type: "number", description: "Longitude" },
};

export const TOOL_CATALOG = [
  {
    name: "get_current_conditions",
    description:
      "Current coastal/home weather from National Weather Service (api.weather.gov). Defaults to Rochester / North Greece / Long Pond.",
    inputSchema: { type: "object", properties: locationProps },
  },
  {
    name: "get_forecast",
    description: "NWS forecast for a location (default 24 hours). Rochester defaults if unspecified.",
    inputSchema: {
      type: "object",
      properties: { ...locationProps, hours: { type: "number", description: "Forecast hours" } },
    },
  },
  {
    name: "get_alerts",
    description: "Active NWS alerts and coastal advisories for a location. Defaults to Rochester area.",
    inputSchema: { type: "object", properties: locationProps },
  },
  {
    name: "get_DOC_advice",
    description:
      "Coastal advisories and protective actions for Home, Mobile, Current location, or Maritime assets.",
    inputSchema: {
      type: "object",
      properties: {
        ...locationProps,
        asset: { type: "string", description: "home | mobile | current | maritime / boat" },
      },
    },
  },
  {
    name: "get_spoken_briefing",
    description: "Sixty-second spoken DOC Watch briefing for Alexa+ voice playback.",
    inputSchema: { type: "object", properties: locationProps },
  },
  {
    name: "get_home_sensors",
    description: "Alexa+ sensors for home/coastal context (temperature, humidity, flood, freeze, motion).",
    inputSchema: { type: "object", properties: locationProps },
  },
  {
    name: "set_watch",
    description: "Watch a location and record wind/freeze/flood thresholds for in-session alerts.",
    inputSchema: {
      type: "object",
      properties: {
        ...locationProps,
        windMph: { type: "number" },
        freezeTempF: { type: "number" },
        flood: { type: "boolean" },
      },
    },
  },
  {
    name: "describe_features",
    description: "Explain DOC Watch: coastal advisories, Alexa+ sensors, Alexa+ MCP usage.",
    inputSchema: { type: "object", properties: {} },
  },
] as const;

export async function runTool(name: string, args: Record<string, unknown> = {}) {
  switch (name) {
    case "get_current_conditions":
      return runGetCurrentConditions(args as any);
    case "get_forecast":
      return runGetForecast(args as any);
    case "get_alerts":
      return runGetAlerts(args as any);
    case "get_DOC_advice":
    case "get_dock_advice":
      return runGetDocAdvice(args as any);
    case "get_spoken_briefing":
      return runGetSpokenBriefing(args as any);
    case "get_home_sensors":
      return runGetHomeSensors(args as any);
    case "set_watch":
      return runSetWatch(args as any);
    case "describe_features":
      return runDescribeFeatures(args as any);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export function toolHuman(result: any): string {
  return (
    result?.structuredContent?.human ||
    result?.content?.[0]?.text ||
    (typeof result === "string" ? result : JSON.stringify(result))
  );
}
