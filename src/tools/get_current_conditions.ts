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
    ? `Partial NWS data for ${loc.label}: ${conditions.textDescription ?? "n/a"}, ${conditions.temperatureF ?? "?"}°F. Warning: ${conditions.error}`
    : `Current dock weather at ${loc.label}: ${conditions.textDescription ?? "conditions"}, ${conditions.temperatureF ?? "?"}°F, humidity ${conditions.humidityPct ?? "?"}%, wind ${conditions.windMph ?? "?"} mph (gust ${conditions.windGustMph ?? "n/a"}). Station ${conditions.station ?? "n/a"}.`;

  return toolResult({
    human,
    data: {
      tool: "get_current_conditions",
      location: loc,
      conditions,
    },
  });
}
