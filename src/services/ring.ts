/**
 * Optional Ring Partner API client + MOCK mode.
 * Default MOCK_RING=true — clearly labeled mock sensors for the hackathon demo.
 * Cameras = visual/motion context ONLY. Never invent live camera weather instruments.
 * Documented Partner-style scopes (simulator): device read, motion events — no live video mesh claim.
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

/** Build clearly labeled mock Ring-style sensors for a location. */
export function getMockHomeSensors(locationName: string): HomeSensorsResult {
  const sensors: RingSensorReading[] = [
    {
      id: "mock-indoor-temp-1",
      name: "Indoor Temp (mock)",
      type: "temperature",
      value: 68,
      unit: "F",
      status: "ok",
      mock: true,
      note: "MOCK — not a live Ring device",
    },
    {
      id: "mock-indoor-humidity-1",
      name: "Indoor Humidity (mock)",
      type: "humidity",
      value: 62,
      unit: "%",
      status: "ok",
      mock: true,
      note: "MOCK humidity spike scenario-ready",
    },
    {
      id: "mock-flood-1",
      name: "Flood / Water Sensor (mock)",
      type: "flood",
      value: false,
      status: "ok",
      mock: true,
      note: "MOCK — dry; would alert on water detect",
    },
    {
      id: "mock-freeze-1",
      name: "Freeze Sensor (mock)",
      type: "freeze",
      value: 38,
      unit: "F",
      status: "ok",
      mock: true,
      note: "MOCK freeze probe near dock hose bib",
    },
    {
      id: "mock-outdoor-cam-1",
      name: "Outdoor Cam Motion (mock)",
      type: "motion_camera",
      value: "motion_event_recent",
      status: "ok",
      mock: true,
      note: "MOCK — motion/visual context only; NOT a weather instrument",
    },
  ];

  console.log(`[Ring] MOCK_RING=true — returning labeled mock sensors for ${locationName}`);

  return {
    mode: "mock",
    labeled: "MOCK MODE",
    locationName,
    sensors,
    disclaimer:
      "Mock Ring-style sensors for architecture demo. Not live Partner API devices. Cameras provide motion/visual context only — never treated as weather instruments. Live OAuth + worldwide mesh is post-win roadmap.",
    human: `MOCK Ring sensors at ${locationName}: indoor 68°F / 62% RH, flood dry, freeze probe 38°F, outdoor cam recent motion (visual context only).`,
  };
}

/**
 * Live path stub — requires Partner OAuth tokens.
 * Tonight we keep mock-safe; if MOCK_RING=false without tokens, return visible error.
 */
export async function getHomeSensors(locationName: string): Promise<HomeSensorsResult> {
  if (mockEnabled()) {
    return getMockHomeSensors(locationName);
  }

  const hasCreds =
    Boolean(process.env.RING_CLIENT_ID?.trim()) &&
    Boolean(process.env.RING_REFRESH_TOKEN?.trim());

  if (!hasCreds) {
    console.warn("[Ring] MOCK_RING=false but Partner credentials missing — falling back to mock");
    const mock = getMockHomeSensors(locationName);
    return {
      ...mock,
      human: `Ring live mode requested but credentials missing. ${mock.human}`,
      disclaimer: `${mock.disclaimer} Visible fallback: credentials required for live Partner API.`,
    };
  }

  // Partner API live fetch would go here with documented scopes.
  // Not implemented for tonight's demo — refuse to invent live camera weather.
  return {
    mode: "live",
    labeled: "LIVE CREDENTIALS PRESENT — LIVE FETCH NOT ENABLED TONIGHT",
    locationName,
    sensors: [],
    disclaimer:
      "Ring Partner credentials detected, but live device fetch is intentionally not enabled for this hackathon build. Use MOCK_RING=true for the demo.",
    human: `Ring credentials present for ${locationName}, but live Partner fetch is disabled in this build. Enable MOCK_RING=true for demo sensors.`,
  };
}
