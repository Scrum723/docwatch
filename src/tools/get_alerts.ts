import { z } from "zod";
import { resolveLocation } from "../services/locations.js";
import { getAlerts } from "../services/nws.js";
import { toolError, toolResult } from "./types.js";

export const getAlertsSchema = {
  city: z.string().optional().describe("City name; defaults to Rochester area"),
  location: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
};

export async function runGetAlerts(args: {
  city?: string;
  location?: string;
  lat?: number;
  lon?: number;
}) {
  const loc = resolveLocation(args);
  const alerts = await getAlerts(loc.lat, loc.lon);

  if (alerts.error) {
    return toolError(`NWS alerts failed for ${loc.name}: ${alerts.error}`, {
      location: loc,
      alerts,
    });
  }

  const human =
    alerts.count === 0
      ? `No active NWS alerts for ${loc.label} right now.`
      : `${alerts.count} active NWS alert(s) for ${loc.label}: ${alerts.alerts
          .map((a) => a.event)
          .join("; ")}.`;

  return toolResult({
    human,
    data: {
      tool: "get_alerts",
      location: loc,
      alerts,
    },
  });
}
