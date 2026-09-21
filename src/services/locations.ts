import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type LocationRecord = {
  key: string;
  name: string;
  label: string;
  lat: number;
  lon: number;
  aliases: string[];
};

type LocationsFile = {
  default: string;
  locations: Record<string, LocationRecord>;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../../data/locations.json");

let cached: LocationsFile | null = null;

function load(): LocationsFile {
  if (!cached) {
    cached = JSON.parse(readFileSync(DATA_PATH, "utf8")) as LocationsFile;
  }
  return cached;
}

/** Resolve city name / key / lat-lon. Defaults to Rochester / North Greece / Long Pond. */
export function resolveLocation(input?: {
  city?: string;
  location?: string;
  lat?: number;
  lon?: number;
}): LocationRecord {
  const data = load();
  if (
    typeof input?.lat === "number" &&
    typeof input?.lon === "number" &&
    Number.isFinite(input.lat) &&
    Number.isFinite(input.lon)
  ) {
    return {
      key: "custom",
      name: `Custom (${input.lat.toFixed(3)}, ${input.lon.toFixed(3)})`,
      label: `Coordinates ${input.lat}, ${input.lon}`,
      lat: input.lat,
      lon: input.lon,
      aliases: [],
    };
  }

  const raw = (input?.city || input?.location || process.env.DEFAULT_LOCATION || data.default)
    .trim()
    .toLowerCase();

  for (const loc of Object.values(data.locations)) {
    if (loc.key === raw || loc.name.toLowerCase() === raw) return loc;
    if (loc.aliases.some((a) => a === raw || raw.includes(a))) return loc;
  }

  // Fuzzy contains on known names
  for (const loc of Object.values(data.locations)) {
    if (raw.includes(loc.key) || loc.name.toLowerCase().includes(raw)) return loc;
  }

  return data.locations[data.default] ?? data.locations.rochester;
}

export function listLocations(): LocationRecord[] {
  return Object.values(load().locations);
}
