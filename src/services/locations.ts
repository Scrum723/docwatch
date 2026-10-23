import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type LocationRecord = {
  key: string;
  name: string;
  label: string;
  lat: number;
  lon: number;
  nearestCoastline?: string;
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
    const nearest = nearestCoastlineForCoords(input.lat, input.lon);
    return {
      key: "custom",
      name: `Custom (${input.lat.toFixed(3)}, ${input.lon.toFixed(3)})`,
      label: `Coordinates ${input.lat}, ${input.lon}`,
      lat: input.lat,
      lon: input.lon,
      nearestCoastline: nearest,
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

  // Unknown place names fail loudly instead of silently returning another city's weather.
  if (input?.city || input?.location) {
    throw new UnknownLocationError(raw, Object.values(data.locations).map((l) => l.name));
  }
  return data.locations[data.default] ?? data.locations.rochester;
}

export class UnknownLocationError extends Error {
  constructor(public input: string, public known: string[]) {
    super(`Unknown location "${input}". Supported: ${known.join("; ")}. Or pass lat and lon.`);
    this.name = "UnknownLocationError";
  }
}

export function listLocations(): LocationRecord[] {
  return Object.values(load().locations);
}

/** Haversine miles between two WGS84 points. */
function milesBetween(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Pick the nearest known coastline label for arbitrary coordinates. */
export function nearestCoastlineForCoords(lat: number, lon: number): string {
  const locs = listLocations().filter((l) => l.nearestCoastline);
  if (locs.length === 0) return "nearest mapped coastline";
  let best = locs[0]!;
  let bestMi = milesBetween(lat, lon, best.lat, best.lon);
  for (const loc of locs.slice(1)) {
    const mi = milesBetween(lat, lon, loc.lat, loc.lon);
    if (mi < bestMi) {
      best = loc;
      bestMi = mi;
    }
  }
  return best.nearestCoastline || "nearest mapped coastline";
}

export function coastlineFor(loc: LocationRecord): string {
  return loc.nearestCoastline || nearestCoastlineForCoords(loc.lat, loc.lon);
}
