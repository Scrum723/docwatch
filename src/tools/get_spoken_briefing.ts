import { describeObsTime } from "./get_current_conditions.js";
import { z } from "zod";
import { evaluateDockAdvice } from "../services/advice.js";
import { enhanceBriefing } from "../services/grok.js";
import { resolveLocation } from "../services/locations.js";
import { getAlerts, getCurrentConditions, getForecast } from "../services/nws.js";
import { buildSpokenBriefingTemplate } from "../services/spoken.js";
import { toolError, toolResult } from "./types.js";

export const getSpokenBriefingSchema = {
  city: z.string().optional(),
  location: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  seconds: z.number().optional().describe("Target spoken length; default 60"),
};

export async function runGetSpokenBriefing(args: {
  city?: string;
  location?: string;
  lat?: number;
  lon?: number;
  seconds?: number;
}) {
  const loc = resolveLocation(args);
  const seconds = args.seconds ?? 60;

  const [conditions, forecast, alertsResp] = await Promise.all([
    getCurrentConditions(loc.lat, loc.lon),
    getForecast(loc.lat, loc.lon, 12),
    getAlerts(loc.lat, loc.lon),
  ]);

  if (conditions.error && forecast.error && alertsResp.error) {
    return toolError(
      `Spoken briefing unavailable: NWS unreachable for ${loc.name}: ${conditions.error}`,
      { location: loc }
    );
  }

  const advice = evaluateDockAdvice({
    locationName: loc.label,
    asset: "dock",
    conditions,
    forecast,
    alerts: alertsResp.alerts,
  });

  const template = buildSpokenBriefingTemplate({
    location: loc.label,
    temp: conditions.temperatureF,
    desc: conditions.textDescription ?? null,
    alertEvents: alertsResp.alerts.map((a) => a.event),
    actions: advice.actions,
    risks: [...new Set(advice.risks.map((r) => r.type))],
    observed: describeObsTime(conditions.observedAt),
    station: conditions.station ?? null,
    nextPeriod: forecast.periods[0]
      ? `${forecast.periods[0].name || "the next period"} looks ${forecast.periods[0].shortForecast ?? "mixed"}, around ${forecast.periods[0].temperature ?? "?"} degrees with wind ${forecast.periods[0].windSpeed ?? "unknown"}`.replace(
          /\s+/g,
          " "
        )
      : undefined,
  });

  const payload = {
    location: loc,
    conditions,
    forecastPeriods: forecast.periods.slice(0, 6),
    alerts: alertsResp.alerts.map((a) => ({
      event: a.event,
      severity: a.severity,
      headline: a.headline,
    })),
    advice,
    links: {
      forecast: `https://forecast.weather.gov/MapClick.php?lat=${loc.lat}&lon=${loc.lon}`,
      radar: "https://radar.weather.gov/",
      alertsMap: "https://www.weather.gov/",
    },
  };

  const briefing = await enhanceBriefing({
    location: loc.label,
    seconds,
    payload,
    template,
  });

  return toolResult({
    human: briefing.text,
    data: {
      tool: "get_spoken_briefing",
      location: loc,
      seconds,
      briefing: briefing.text,
      grokEnhanced: briefing.enhanced,
      structuredAlert: {
        risks: advice.risks,
        actions: advice.actions,
        temperatureF: conditions.temperatureF,
        alertCount: alertsResp.count,
      },
    },
  });
}
