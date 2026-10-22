import { describeObsTime } from "./get_current_conditions.js";
import { z } from "zod";
import { evaluateDockAdvice } from "../services/advice.js";
import { enhanceBriefing } from "../services/grok.js";
import { resolveLocation } from "../services/locations.js";
import { getAlerts, getCurrentConditions, getForecast } from "../services/nws.js";
import { toolError, toolResult } from "./types.js";

export const getSpokenBriefingSchema = {
  city: z.string().optional(),
  location: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  seconds: z.number().optional().describe("Target spoken length; default 60"),
};

function buildTemplate(args: {
  location: string;
  seconds: number;
  temp: number | null;
  desc: string | null;
  alertEvents: string[];
  actions: string[];
  risks: string[];
  observed?: string;
  nextPeriod?: string;
}): string {
  const alertLine =
    args.alertEvents.length > 0
      ? `Active alerts include ${args.alertEvents.slice(0, 3).join(", ")}.`
      : "There are no active National Weather Service alerts at this location right now.";
  const riskLine =
    args.risks.length > 0
      ? `DOC flags ${args.risks.join(", ")} over the next twelve hours.`
      : "DOC does not see elevated freeze, wind, or flood flags in the immediate window.";
  const acts = args.actions.slice(0, 3);
  const actionLine = acts.length ? `Recommended actions: ${acts.join("; ")}.` : "No special actions needed; stay weather-aware.";
  return (
    `Here is your DOC Watch briefing for ${args.location}, based on National Weather Service data. ` +
    (args.temp != null
      ? `The latest observation, ${args.observed ?? "time unknown"}, shows ${args.desc ?? "conditions"} at ${args.temp} degrees. `
      : "Current observations are unavailable right now. ") +
    (args.nextPeriod ? `Coming up: ${args.nextPeriod}. ` : "") +
    `${alertLine} ${riskLine} ` +
    `${actionLine} ` +
    `Want the hourly forecast or alert details?`
  );
}

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

  const template = buildTemplate({
    location: loc.label,
    seconds,
    temp: conditions.temperatureF,
    desc: conditions.textDescription ?? null,
    alertEvents: alertsResp.alerts.map((a) => a.event),
    actions: advice.actions,
    risks: advice.risks.map((r) => r.type),
    observed: describeObsTime(conditions.observedAt),
    nextPeriod: forecast.periods[0]
      ? `${forecast.periods[0].shortForecast ?? ""}, ${forecast.periods[0].temperature ?? "?"} degrees, wind ${forecast.periods[0].windSpeed ?? "unknown"}`.replace(/^, /, "")
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
