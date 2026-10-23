import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAlertsSchema, runGetAlerts } from "./get_alerts.js";
import { getCurrentConditionsSchema, runGetCurrentConditions } from "./get_current_conditions.js";
import { describeFeaturesSchema, runDescribeFeatures } from "./describe_features.js";
import { getDocAdviceSchema, runGetDocAdvice } from "./get_DOC_advice.js";
import { getForecastSchema, runGetForecast } from "./get_forecast.js";
import { getHomeSensorsSchema, runGetHomeSensors } from "./get_home_sensors.js";
import { getSpokenBriefingSchema, runGetSpokenBriefing } from "./get_spoken_briefing.js";
import { setWatchSchema, runSetWatch } from "./set_watch.js";

/** Register all eight DOC Watch MCP tools (exact names required by Alexa+ submission). */
export function registerAllTools(server: McpServer): void {
  server.registerTool(
    "get_current_conditions",
    {
      description:
        "Current coastal/home weather from National Weather Service (api.weather.gov). Defaults to Rochester / North Greece / Long Pond.",
      inputSchema: getCurrentConditionsSchema,
    },
    async (args) => safe(() => runGetCurrentConditions(args))
  );

  server.registerTool(
    "get_forecast",
    {
      description: "NWS forecast for a location (default 24 hours). Rochester defaults if unspecified.",
      inputSchema: getForecastSchema,
    },
    async (args) => safe(() => runGetForecast(args))
  );

  server.registerTool(
    "get_alerts",
    {
      description: "Active NWS alerts and coastal advisories for a location. Defaults to Rochester area.",
      inputSchema: getAlertsSchema,
    },
    async (args) => safe(() => runGetAlerts(args))
  );

  server.registerTool(
    "get_DOC_advice",
    {
      description:
        "Coastal advisories and protective actions for Home, Mobile, Current location, or Maritime assets. Always reports the nearest coastline. Freeze/wind/flood/coastal rules plus optional Grok narrative.",
      inputSchema: getDocAdviceSchema,
    },
    async (args) => safe(() => runGetDocAdvice(args))
  );

  server.registerTool(
    "get_spoken_briefing",
    {
      description: "Sixty-second spoken DOC Watch briefing for Alexa+ voice playback.",
      inputSchema: getSpokenBriefingSchema,
    },
    async (args) => safe(() => runGetSpokenBriefing(args))
  );

  server.registerTool(
    "get_home_sensors",
    {
      description: "Alexa+ sensors for home/coastal context (temperature, humidity, flood, freeze, motion).",
      inputSchema: getHomeSensorsSchema,
    },
    async (args) => safe(() => runGetHomeSensors(args))
  );

  server.registerTool(
    "set_watch",
    {
      description:
        "Watch a location and record wind/freeze/flood thresholds for in-session alerts.",
      inputSchema: setWatchSchema,
    },
    async (args) => safe(() => runSetWatch(args))
  );

  server.registerTool(
    "describe_features",
    {
      description:
        "Explain DOC Watch: coastal advisories, Alexa+ sensors, how to join as a node, Alexa+ MCP usage.",
      inputSchema: describeFeaturesSchema,
    },
    async (args) => safe(() => runDescribeFeatures(args))
  );
}

export const TOOL_NAMES = [
  "get_current_conditions",
  "get_forecast",
  "get_alerts",
  "get_DOC_advice",
  "get_spoken_briefing",
  "get_home_sensors",
  "set_watch",
  "describe_features",
] as const;

/** Convert thrown errors into clean MCP tool errors with a structured log line. */
async function safe<T>(fn: () => Promise<T> | T): Promise<any> {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ level: "error", event: "tool_error", message, ts: new Date().toISOString() }));
    return { isError: true, content: [{ type: "text", text: `DOC Watch could not complete that request. ${message}` }] };
  }
}
