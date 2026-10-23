/**
 * Alexa+ context sensors for DOC Watch.
 * Default MOCK_RING=true builds simulated readings for the architecture demo.
 * Cameras = visual/motion context ONLY. Never invent live camera weather instruments.
 */

export type RingSensorReading = {
  id: string;
  name: string;
  type: "temperature" | "humidity" | "flood" | "freeze" | "motion_camera";
  value: string | number | boolean;
  unit?: string;
  status: "ok" | "alert" | "unknown";
  mock: true | false;
  note?: string;
};

export type HomeSensorsResult = {
  mode: "mock" | "live";
  labeled: string;
  locationName: string;
  sensors: RingSensorReading[];
  disclaimer: string;
  human: string;
};

function mockEnabled(): boolean {
  const v = (process.env.MOCK_RING ?? "true").toLowerCase();
  return v !== "false" && v !== "0" && v !== "no";
}

/** Build Alexa+ context sensors for a location (simulated when MOCK_RING=true). */
export function getMockHomeSensors(locationName: string): HomeSensorsResult {
  const sensors: RingSensorReading[] = [
    {
      id: "alexa-indoor-temp-1",
      name: "Indoor Temp (Alexa+)",
      type: "temperature",
      value: 68,
      unit: "F",
      status: "ok",
      mock: true,
      note: "Alexa+ context sensor",
    },
    {
      id: "alexa-indoor-humidity-1",
      name: "Indoor Humidity (Alexa+)",
      type: "humidity",
      value: 62,
      unit: "%",
      status: "ok",
      mock: true,
      note: "Alexa+ humidity context",
    },
    {
      id: "alexa-flood-1",
      name: "Flood / Water Sensor (Alexa+)",
      type: "flood",
      value: false,
      status: "ok",
      mock: true,
      note: "Alexa+: dry; would alert on water detect",
    },
    {
      id: "alexa-freeze-1",
      name: "Freeze Sensor (Alexa+)",
      type: "freeze",
      value: 38,
      unit: "F",
      status: "ok",
      mock: true,
      note: "Alexa+ freeze probe near shoreline hose bib",
    },
    {
      id: "alexa-outdoor-cam-1",
      name: "Outdoor Cam Motion (Alexa+)",
      type: "motion_camera",
      value: "motion_event_recent",
      status: "ok",
      mock: true,
      note: "Alexa+: motion/visual context only; NOT a weather instrument",
    },
  ];

  console.log(`[Alexa+] returning Alexa+ sensors for ${locationName}`);

  return {
    mode: "mock",
    labeled: "Alexa+ sensors",
    locationName,
    sensors,
    disclaimer:
      "Alexa+ context sensors for the DOC Watch architecture demo. Cameras provide motion/visual context only and are never treated as weather instruments. Live device mesh is post-win roadmap.",
    human: `Alexa+ sensors at ${locationName}: indoor 68°F / 62% RH, flood dry, freeze probe 38°F, outdoor cam recent motion (visual context only).`,
  };
}

/**
 * Live path stub: requires Partner OAuth tokens.
 * Keep demo-safe; if MOCK_RING=false without tokens, fall back to Alexa+ sensors.
 */
export async function getHomeSensors(locationName: string): Promise<HomeSensorsResult> {
  if (mockEnabled()) {
    return getMockHomeSensors(locationName);
  }

  const hasCreds =
    Boolean(process.env.RING_CLIENT_ID?.trim()) &&
    Boolean(process.env.RING_REFRESH_TOKEN?.trim());

  if (!hasCreds) {
    console.warn("[Alexa+] live mode requested but credentials missing: using Alexa+ sensors");
    const mock = getMockHomeSensors(locationName);
    return {
      ...mock,
      human: `Live credentials missing. ${mock.human}`,
      disclaimer: `${mock.disclaimer} Visible fallback: credentials required for live Partner API.`,
    };
  }

  return {
    mode: "live",
    labeled: "Alexa+ sensors (live fetch not enabled)",
    locationName,
    sensors: [],
    disclaimer:
      "Credentials detected, but live device fetch is intentionally not enabled for this hackathon build. Use MOCK_RING=true for Alexa+ sensors.",
    human: `Credentials present for ${locationName}, but live Partner fetch is disabled in this build. Enable MOCK_RING=true for Alexa+ sensors.`,
  };
}
