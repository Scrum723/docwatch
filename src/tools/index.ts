import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAlertsSchema, runGetAlerts } from "./get_alerts.js";
import { getCurrentConditionsSchema, runGetCurrentConditions } from "./get_current_conditions.js";
import { describeFeaturesSchema, runDescribeFeatures } from "./describe_features.js";
import { getDockAdviceSchema, runGetDockAdvice } from "./get_dock_advice.js";
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
        "Current dock/home weather from National Weather Service (api.weather.gov). Defaults to Rochester / North Greece / Long Pond.",
      inputSchema: getCurrentConditionsSchema,
    },
    async (args) => runGetCurrentConditions(args)
  );

  server.registerTool(
    "get_forecast",
    {
      description: "NWS forecast for a location (default 24 hours). Rochester defaults if unspecified.",
      inputSchema: getForecastSchema,
    },
    async (args) => runGetForecast(args)
  );

  server.registerTool(
    "get_alerts",
    {
      description: "Active NWS alerts for a location. Defaults to Rochester area.",
      inputSchema: getAlertsSchema,
    },
    async (args) => runGetAlerts(args)
  );

  server.registerTool(
    "get_dock_advice",
    {
      description:
        "Should I pull the boat, cover the dock, or move the van? Freeze/wind/flood rules plus optional Grok narrative.",
      inputSchema: getDockAdviceSchema,
    },
    async (args) => runGetDockAdvice(args)
  );

  server.registerTool(
    "get_spoken_briefing",
    {
      description: "Sixty-second spoken DOC Watch briefing for Alexa+ voice playback.",
      inputSchema: getSpokenBriefingSchema,
    },
    async (args) => runGetSpokenBriefing(args)
  );

  server.registerTool(
    "get_home_sensors",
    {
      description:
        "Ring-style home/dock sensors. Default MOCK_RING=true with clearly labeled mock temp/humidity/flood/freeze/motion.",
      inputSchema: getHomeSensorsSchema,
    },
    async (args) => runGetHomeSensors(args)
  );

  server.registerTool(
    "set_watch",
    {
      description:
        "Watch a location and record wind/freeze/flood thresholds for in-session alerts.",
      inputSchema: setWatchSchema,
    },
    async (args) => runSetWatch(args)
  );

  server.registerTool(
    "describe_features",
    {
      description:
        "Explain DOC Watch: mesh vision, flood/freeze sensors, how to join as a node, Alexa+ MCP usage.",
      inputSchema: describeFeaturesSchema,
    },
    async (args) => runDescribeFeatures(args)
  );
}

export const TOOL_NAMES = [
  "get_current_conditions",
  "get_forecast",
  "get_alerts",
  "get_dock_advice",
  "get_spoken_briefing",
  "get_home_sensors",
  "set_watch",
  "describe_features",
] as const;
