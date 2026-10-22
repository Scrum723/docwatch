import { z } from "zod";
import { resolveLocation } from "../services/locations.js";
import { getCurrentConditions } from "../services/nws.js";
import { toolError, toolResult } from "./types.js";

export const getCurrentConditionsSchema = {
  city: z
    .string()
    .optional()
    .describe("City name; defaults to Rochester / North Greece / Long Pond"),
  location: z.string().optional().describe("Location key or alias"),
  lat: z.number().optional().describe("Latitude"),
  lon: z.number().optional().describe("Longitude"),
};

export async function runGetCurrentConditions(args: {
  city?: string;
  location?: string;
  lat?: number;
  lon?: number;
}) {
  const loc = resolveLocation(args);
  const conditions = await getCurrentConditions(loc.lat, loc.lon);

  if (conditions.error && conditions.temperatureF == null) {
    return toolError(
      `NWS current conditions failed for ${loc.name}: ${conditions.error}`,
      { location: loc, conditions }
    );
  }

  const human = conditions.error
    ? `I only got partial National Weather Service data for ${loc.label}: ${conditions.textDescription ?? "n/a"}, ${conditions.temperatureF ?? "?"}°F. Warning: ${conditions.error}`
    : `Right now at ${loc.label} it is ${conditions.textDescription ?? "mixed"}, about ${conditions.temperatureF ?? "?"}°F, humidity ${conditions.humidityPct ?? "?"}%, wind ${conditions.windMph ?? "?"} mph (gust ${conditions.windGustMph ?? "n/a"}). That comes from NWS station ${conditions.station ?? "n/a"}, observed ${describeObsTime(conditions.observedAt)}.`;

  return toolResult({
    human,
    data: {
      tool: "get_current_conditions",
      location: loc,
      conditions,
    },
  });
}

export function describeObsTime(iso?: string): string {
  if (!iso) return "at an unknown time";
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "at an unknown time";
  const ageMin = Math.round((Date.now() - t.getTime()) / 60000);
  const local = t.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", month: "short", day: "numeric" }) + " ET";
  return ageMin > 90 ? `${local} (about ${Math.round(ageMin / 60)} hours old, may be stale)` : local;
}
