/**
 * DOC Watch coastal / home risk rules.
 * Freeze: temp ≤ 36°F or freeze-related NWS alert
 * Wind: gusts ≥ 25 mph
 * Flood / heavy rain / coastal: from NWS alerts
 * Advice always cites the nearest coastline for the resolved place.
 */

import type { NwsAlert, NwsConditions, NwsForecast } from "./nws.js";
import { parseWindGustMph } from "./nws.js";
import { buildAdviceHuman } from "./spoken.js";

export type Asset = "home" | "mobile" | "current_location" | "maritime";

export type RiskFlag = {
  type: "freeze" | "wind" | "flood" | "severe" | "heavy_rain" | "coastal";
  level: "watch" | "warning" | "advisory" | "elevated";
  reason: string;
};

export type DocAdviceResult = {
  locationName: string;
  nearestCoastline: string;
  asset: Asset;
  risks: RiskFlag[];
  actions: string[];
  summary: string;
  human: string;
  inputs: {
    temperatureF: number | null;
    windGustMph: number | null;
    alertEvents: string[];
  };
};

/** @deprecated use DocAdviceResult */
export type DockAdviceResult = DocAdviceResult;

const FREEZE_TEMP_F = 36;
const WIND_GUST_MPH = 25;

const FREEZE_EVENTS = /freeze|frost|winter storm|cold|ice storm|wind chill/i;
const FLOOD_EVENTS = /flood|flash flood|coastal flood|lakeshore flood/i;
const COASTAL_EVENTS =
  /coastal|lakeshore|marine|gale|small craft|beach hazard|rip current|surf|high surf|storm surge/i;
const RAIN_EVENTS = /heavy rain|excessive rainfall|flash flood watch/i;
const SEVERE_EVENTS = /tornado|severe thunderstorm|high wind|hurricane|blizzard/i;
const WIND_EVENTS = /high wind|wind advisory|gale|storm warning/i;

const ASSET_ALIASES: Record<string, Asset> = {
  home: "home",
  mobile: "mobile",
  current_location: "current_location",
  "current location": "current_location",
  maritime: "maritime",
  // legacy playground values
  dock: "maritime",
  boat: "maritime",
  van: "mobile",
};

export function normalizeAsset(raw?: string | null): Asset {
  if (!raw) return "maritime";
  const key = raw.trim().toLowerCase().replace(/-/g, "_");
  return ASSET_ALIASES[key] ?? ASSET_ALIASES[key.replace(/_/g, " ")] ?? "maritime";
}

export function evaluateDocAdvice(input: {
  locationName: string;
  nearestCoastline: string;
  asset: Asset;
  conditions: NwsConditions;
  forecast: NwsForecast;
  alerts: NwsAlert[];
}): DocAdviceResult {
  const risks: RiskFlag[] = [];
  const actions = new Set<string>();

  const temp = input.conditions.temperatureF;
  let gust = input.conditions.windGustMph ?? input.conditions.windMph;

  for (const p of input.forecast.periods) {
    const unit = (p.temperatureUnit || "F").toUpperCase();
    const tF = unit === "C" ? Math.round((p.temperature * 9) / 5 + 32) : p.temperature;
    if (tF <= FREEZE_TEMP_F) {
      risks.push({
        type: "freeze",
        level: "elevated",
        reason: `Forecast ${p.name || p.startTime}: ${tF}°F ≤ ${FREEZE_TEMP_F}°F`,
      });
    }
    const g = parseWindGustMph(p.windSpeed);
    if (g != null && (gust == null || g > gust)) gust = g;
    if (g != null && g >= WIND_GUST_MPH) {
      risks.push({
        type: "wind",
        level: "elevated",
        reason: `Forecast wind ${p.windSpeed} (≥ ${WIND_GUST_MPH} mph threshold)`,
      });
    }
  }

  if (temp != null && temp <= FREEZE_TEMP_F) {
    risks.push({
      type: "freeze",
      level: "elevated",
      reason: `Current temperature ${temp}°F ≤ ${FREEZE_TEMP_F}°F freeze threshold`,
    });
  }

  if (gust != null && gust >= WIND_GUST_MPH) {
    risks.push({
      type: "wind",
      level: "elevated",
      reason: `Wind/gust ${gust} mph ≥ ${WIND_GUST_MPH} mph threshold`,
    });
  }

  for (const a of input.alerts) {
    const event = a.event || a.headline || "";
    if (FREEZE_EVENTS.test(event)) {
      risks.push({
        type: "freeze",
        level: /warning/i.test(event) ? "warning" : "watch",
        reason: `NWS alert: ${a.headline || event}`,
      });
    }
    if (FLOOD_EVENTS.test(event)) {
      risks.push({
        type: "flood",
        level: /warning/i.test(event) ? "warning" : "watch",
        reason: `NWS alert: ${a.headline || event}`,
      });
    }
    if (COASTAL_EVENTS.test(event)) {
      risks.push({
        type: "coastal",
        level: /warning/i.test(event) ? "warning" : /advisory/i.test(event) ? "advisory" : "watch",
        reason: `NWS coastal advisory: ${a.headline || event}`,
      });
    }
    if (RAIN_EVENTS.test(event) && !FLOOD_EVENTS.test(event)) {
      risks.push({
        type: "heavy_rain",
        level: "advisory",
        reason: `NWS alert: ${a.headline || event}`,
      });
    }
    if (SEVERE_EVENTS.test(event)) {
      risks.push({
        type: "severe",
        level: /warning/i.test(event) ? "warning" : "watch",
        reason: `NWS alert: ${a.headline || event}`,
      });
    }
    if (WIND_EVENTS.test(event)) {
      risks.push({
        type: "wind",
        level: /warning/i.test(event) ? "warning" : "advisory",
        reason: `NWS alert: ${a.headline || event}`,
      });
    }
  }

  const deduped: RiskFlag[] = [];
  const seen = new Set<string>();
  for (const r of risks) {
    const key = `${r.type}:${r.reason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }

  const has = (t: RiskFlag["type"]) => deduped.some((r) => r.type === t);
  const asset = input.asset;

  if (has("freeze")) {
    actions.add("watch freeze");
    if (asset === "maritime") {
      actions.add("pull small craft");
      actions.add("add lines");
      actions.add("secure shoreline gear");
    }
    if (asset === "home" || asset === "current_location") actions.add("secure loose gear");
    if (asset === "mobile") actions.add("move vehicle from trees");
  }
  if (has("wind") || has("severe") || has("coastal")) {
    actions.add("secure loose gear");
    if (asset === "maritime") {
      actions.add("add lines");
      actions.add("pull small craft");
      actions.add("heed coastal advisories");
    }
    if (asset === "mobile") actions.add("move vehicle from trees");
    if (asset === "home" || asset === "current_location") actions.add("heed coastal advisories");
  }
  if (has("flood") || has("heavy_rain")) {
    actions.add("watch flood");
    if (asset === "maritime") {
      actions.add("pull small craft");
      actions.add("add lines");
    }
    if (asset === "mobile") actions.add("move vehicle from trees");
  }

  if (actions.size === 0) {
    actions.add("stay weather-aware");
    actions.add("check coastal advisories");
  }

  const actionList = [...actions].slice(0, 5);
  const hasElevated = deduped.length > 0;
  const riskLabels = hasElevated
    ? deduped.map((r) => `${r.type} (${r.level})`).join(", ")
    : "no elevated freeze/wind/flood/coastal flags";

  const coastline = input.nearestCoastline || "nearest mapped coastline";
  const summary = `DOC Watch ${asset} coastal advisories for ${input.locationName} (nearest coastline: ${coastline}): ${riskLabels}. Actions: ${actionList.join("; ")}.`;
  const human = buildAdviceHuman({
    locationName: input.locationName,
    nearestCoastline: coastline,
    asset,
    riskLabels,
    hasElevated,
    actions: actionList,
  });

  return {
    locationName: input.locationName,
    nearestCoastline: coastline,
    asset,
    risks: deduped,
    actions: actionList,
    summary,
    human,
    inputs: {
      temperatureF: temp,
      windGustMph: gust ?? null,
      alertEvents: input.alerts.map((a) => a.event),
    },
  };
}

/** @deprecated prefer evaluateDocAdvice */
export function evaluateDockAdvice(
  input: Parameters<typeof evaluateDocAdvice>[0] & { nearestCoastline?: string; asset: Asset | string }
): DocAdviceResult {
  return evaluateDocAdvice({
    ...input,
    asset: normalizeAsset(String(input.asset)),
    nearestCoastline: input.nearestCoastline || "nearest mapped coastline",
  });
}
