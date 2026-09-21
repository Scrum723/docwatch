import { z } from "zod";
import { resolveLocation } from "../services/locations.js";
import { getHomeSensors } from "../services/ring.js";
import { toolResult } from "./types.js";

export const getHomeSensorsSchema = {
  city: z.string().optional(),
  location: z.string().optional().describe("Location for associated home/dock sensors"),
  lat: z.number().optional(),
  lon: z.number().optional(),
};

export async function runGetHomeSensors(args: {
  city?: string;
  location?: string;
  lat?: number;
  lon?: number;
}) {
  const loc = resolveLocation(args);
  // Ring optional Partner API / mock — see services/ring.ts
  const sensors = await getHomeSensors(loc.label);

  return toolResult({
    human: `[${sensors.labeled}] ${sensors.human}`,
    data: {
      tool: "get_home_sensors",
      location: loc,
      mode: sensors.mode,
      labeled: sensors.labeled,
      sensors: sensors.sensors,
      disclaimer: sensors.disclaimer,
    },
  });
}
