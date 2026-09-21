import { z } from "zod";
import { resolveLocation } from "../services/locations.js";
import { getForecast } from "../services/nws.js";
import { toolError, toolResult } from "./types.js";

export const getForecastSchema = {
  city: z.string().optional().describe("City name; defaults to Rochester area"),
  location: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  hours: z.number().optional().describe("Forecast horizon in hours; default 24"),
};

export async function runGetForecast(args: {
  city?: string;
  location?: string;
  lat?: number;
  lon?: number;
  hours?: number;
}) {
  const loc = resolveLocation(args);
  const hours = args.hours ?? 24;
  const forecast = await getForecast(loc.lat, loc.lon, hours);

  if (forecast.error && forecast.periods.length === 0) {
    return toolError(`NWS forecast failed for ${loc.name}: ${forecast.error}`, {
      location: loc,
      forecast,
    });
  }

  const first = forecast.periods[0];
  const human = first
    ? `${hours}h forecast for ${loc.label}: starting ${first.shortForecast}, ${first.temperature}°${first.temperatureUnit}, wind ${first.windSpeed}. ${forecast.periods.length} periods from api.weather.gov.`
    : `No forecast periods returned for ${loc.label}.${forecast.error ? ` ${forecast.error}` : ""}`;

  return toolResult({
    human,
    data: {
      tool: "get_forecast",
      location: loc,
      hours,
      forecast,
    },
  });
}
