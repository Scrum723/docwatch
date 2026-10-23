import { z } from "zod";
import { evaluateDocAdvice, normalizeAsset, type Asset } from "../services/advice.js";
import { enhanceAdvice } from "../services/grok.js";
import { coastlineFor, resolveLocation } from "../services/locations.js";
import { getAlerts, getCurrentConditions, getForecast } from "../services/nws.js";
import { toolError, toolResult } from "./types.js";

export const getDocAdviceSchema = {
  city: z.string().optional(),
  location: z.string().optional().describe("Location; defaults to Rochester / Long Pond"),
  lat: z.number().optional(),
  lon: z.number().optional(),
  asset: z
    .enum(["home", "mobile", "current_location", "maritime", "dock", "boat", "van"])
    .optional()
    .describe("Asset: home, mobile, current_location, or maritime"),
};

export async function runGetDocAdvice(args: {
  city?: string;
  location?: string;
  lat?: number;
  lon?: number;
  asset?: Asset | string;
}) {
  const loc = resolveLocation(args);
  const asset = normalizeAsset(args.asset ? String(args.asset) : "maritime");
  const nearestCoastline = coastlineFor(loc);

  const [conditions, forecast, alertsResp] = await Promise.all([
    getCurrentConditions(loc.lat, loc.lon),
    getForecast(loc.lat, loc.lon, 24),
    getAlerts(loc.lat, loc.lon),
  ]);

  if (conditions.error && forecast.error && alertsResp.error) {
    return toolError(
      `Cannot compute DOC advice for ${loc.name}: NWS unreachable (${conditions.error})`,
      { location: loc, nearestCoastline, conditions, forecast, alerts: alertsResp }
    );
  }

  const advice = evaluateDocAdvice({
    locationName: loc.label,
    nearestCoastline,
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
    ? /suggested next steps|actions?:|coastal advisories/i.test(enhanced.text)
      ? enhanced.text
      : `${enhanced.text} Suggested next steps: ${advice.actions.join("; ")}.`
    : advice.human;

  return toolResult({
    human,
    data: {
      tool: "get_DOC_advice",
      location: loc,
      nearestCoastline,
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

/** @deprecated alias */
export const getDockAdviceSchema = getDocAdviceSchema;
export const runGetDockAdvice = runGetDocAdvice;
