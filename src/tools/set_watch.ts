import { z } from "zod";
import { resolveLocation } from "../services/locations.js";
import { listWatches, setWatch } from "../services/watch.js";
import { toolResult } from "./types.js";

export const setWatchSchema = {
  city: z.string().optional(),
  location: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  windMph: z.number().optional().describe("Wind/gust threshold mph; default 25"),
  freezeTempF: z.number().optional().describe("Freeze threshold °F; default 36"),
  flood: z.boolean().optional().describe("Alert on flood/heavy-rain NWS alerts; default true"),
};

export async function runSetWatch(args: {
  city?: string;
  location?: string;
  lat?: number;
  lon?: number;
  windMph?: number;
  freezeTempF?: number;
  flood?: boolean;
}) {
  const loc = resolveLocation(args);
  const record = setWatch({
    locationKey: loc.key,
    locationName: loc.label,
    lat: loc.lat,
    lon: loc.lon,
    thresholds: {
      windMph: args.windMph,
      freezeTempF: args.freezeTempF,
      flood: args.flood,
    },
  });

  const human = `Watch set for ${record.locationName}: wind ≥ ${record.thresholds.windMph} mph, freeze ≤ ${record.thresholds.freezeTempF}°F, flood alerts ${record.thresholds.flood ? "on" : "off"}. Watch id ${record.id}.`;

  return toolResult({
    human,
    data: {
      tool: "set_watch",
      watch: record,
      activeWatches: listWatches(),
    },
  });
}
