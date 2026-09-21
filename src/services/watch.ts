/**
 * In-session watch thresholds for DOC Watch alerts.
 * Survives for the life of the Node process (demo-scale, no DB tonight).
 */

export type WatchThresholds = {
  windMph?: number;
  freezeTempF?: number;
  flood?: boolean;
};

export type WatchRecord = {
  id: string;
  locationKey: string;
  locationName: string;
  lat: number;
  lon: number;
  thresholds: WatchThresholds;
  createdAt: string;
};

const watches = new Map<string, WatchRecord>();

export function setWatch(input: {
  locationKey: string;
  locationName: string;
  lat: number;
  lon: number;
  thresholds: WatchThresholds;
}): WatchRecord {
  const id = `watch-${input.locationKey}-${Date.now()}`;
  const record: WatchRecord = {
    id,
    locationKey: input.locationKey,
    locationName: input.locationName,
    lat: input.lat,
    lon: input.lon,
    thresholds: {
      windMph: input.thresholds.windMph ?? 25,
      freezeTempF: input.thresholds.freezeTempF ?? 36,
      flood: input.thresholds.flood ?? true,
    },
    createdAt: new Date().toISOString(),
  };
  watches.set(id, record);
  console.log(`[Watch] set ${id} for ${record.locationName}`, record.thresholds);
  return record;
}

export function listWatches(): WatchRecord[] {
  return [...watches.values()];
}

export function clearWatches(): void {
  watches.clear();
}
