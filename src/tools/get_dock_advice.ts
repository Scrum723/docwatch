import { z } from "zod";
import { evaluateDockAdvice, type Asset } from "../services/advice.js";
import { enhanceAdvice } from "../services/grok.js";
import { resolveLocation } from "../services/locations.js";
import { getAlerts, getCurrentConditions, getForecast } from "../services/nws.js";
import { toolError, toolResult } from "./types.js";

export const getDockAdviceSchema = {
  city: z.string().optional(),
  location: z.string().optional().describe("Location; defaults to Rochester / Long Pond"),
  lat: z.number().optional(),
  lon: z.number().optional(),
  asset: z
    .enum(["dock", "boat", "van", "home"])
    .optional()
    .describe("Asset to protect: dock, boat, van, or home"),
};

export async function runGetDockAdvice(args: {
  city?: string;
  location?: string;
  lat?: number;
  lon?: number;
  asset?: Asset;
}) {
  const loc = resolveLocation(args);
  const asset: Asset = args.asset ?? "dock";

  const [conditions, forecast, alertsResp] = await Promise.all([
    getCurrentConditions(loc.lat, loc.lon),
    getForecast(loc.lat, loc.lon, 24),
    getAlerts(loc.lat, loc.lon),
  ]);

  if (conditions.error && forecast.error && alertsResp.error) {
    return toolError(
      `Cannot compute dock advice for ${loc.name}: NWS unreachable (${conditions.error})`,
      { location: loc, conditions, forecast, alerts: alertsResp }
    );
  }

  const advice = evaluateDockAdvice({
    locationName: loc.label,
    asset,
    conditions,
    forecast,
    alerts: alertsResp.alerts,
  });

  const enhanced = await enhanceAdvice({
    location: loc.label,
    asset,
    payload: advice,
    template: advice.human,
  });

  const human = enhanced.enhanced
    ? `${enhanced.text} Actions: ${advice.actions.join("; ")}.`
    : advice.human;

  return toolResult({
    human,
    data: {
      tool: "get_dock_advice",
      location: loc,
      asset,
      advice: {
        risks: advice.risks,
        actions: advice.actions,
        summary: advice.summary,
        inputs: advice.inputs,
      },
      grokEnhanced: enhanced.enhanced,
      narrative: enhanced.text,
      conditions,
      alertCount: alertsResp.count,
      nwsErrors: {
        conditions: conditions.error ?? null,
        forecast: forecast.error ?? null,
        alerts: alertsResp.error ?? null,
      },
    },
  });
}
