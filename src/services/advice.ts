/**
 * Dock / home risk rules for DOC Watch.
 * Freeze: temp ≤ 36°F or freeze-related NWS alert
 * Wind: gusts ≥ 25 mph
 * Flood / heavy rain: from NWS alerts
 */

import type { NwsAlert, NwsConditions, NwsForecast } from "./nws.js";
import { parseWindGustMph } from "./nws.js";

export type Asset = "dock" | "boat" | "van" | "home";

export type RiskFlag = {
  type: "freeze" | "wind" | "flood" | "severe" | "heavy_rain";
  level: "watch" | "warning" | "advisory" | "elevated";
  reason: string;
};

export type DockAdviceResult = {
  locationName: string;
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

const FREEZE_TEMP_F = 36;
const WIND_GUST_MPH = 25;

const FREEZE_EVENTS = /freeze|frost|winter storm|cold|ice storm|wind chill/i;
const FLOOD_EVENTS = /flood|flash flood|coastal flood|lakeshore flood/i;
const RAIN_EVENTS = /heavy rain|excessive rainfall|flash flood watch/i;
const SEVERE_EVENTS = /tornado|severe thunderstorm|high wind|hurricane|blizzard/i;
const WIND_EVENTS = /high wind|wind advisory|gale|storm warning/i;

export function evaluateDockAdvice(input: {
  locationName: string;
  asset: Asset;
  conditions: NwsConditions;
  forecast: NwsForecast;
  alerts: NwsAlert[];
}): DockAdviceResult {
  const risks: RiskFlag[] = [];
  const actions = new Set<string>();

  const temp = input.conditions.temperatureF;
  let gust = input.conditions.windGustMph ?? input.conditions.windMph;

  // Scan forecast for colder temps / stronger winds in next periods
  for (const p of input.forecast.periods) {
    const unit = (p.temperatureUnit || "F").toUpperCase();
    const tF = unit === "C" ? Math.round((p.temperature * 9) / 5 + 32) : p.temperature;
    if (temp == null || tF < temp) {
      // track min later via freeze check
    }
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

  // Deduplicate risk types keeping highest severity-ish first
  const deduped: RiskFlag[] = [];
  const seen = new Set<string>();
  for (const r of risks) {
    const key = `${r.type}:${r.reason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }

  const has = (t: RiskFlag["type"]) => deduped.some((r) => r.type === t);

  // Asset-specific actions
  if (has("freeze")) {
    actions.add("watch freeze");
    if (input.asset === "boat" || input.asset === "dock") {
      actions.add("pull small craft");
      actions.add("add lines");
      actions.add("cover dock");
    }
    if (input.asset === "home") actions.add("secure loose gear");
    if (input.asset === "van") actions.add("move van from trees");
  }
  if (has("wind") || has("severe")) {
    actions.add("add lines");
    actions.add("secure loose gear");
    if (input.asset === "boat") actions.add("pull small craft");
    if (input.asset === "van" || input.asset === "home") actions.add("move van from trees");
    if (input.asset === "dock") actions.add("cover dock");
  }
  if (has("flood") || has("heavy_rain")) {
    actions.add("watch flood");
    if (input.asset === "boat") actions.add("pull small craft");
    if (input.asset === "van") actions.add("move van from trees");
    if (input.asset === "dock") {
      actions.add("add lines");
      actions.add("cover dock");
    }
  }

  if (actions.size === 0) {
    actions.add("stay weather-aware");
    actions.add("secure loose gear");
  }

  // Cap to a clear action list
  const actionList = [...actions].slice(0, 5);
  const riskLabels = deduped.length
    ? deduped.map((r) => `${r.type} (${r.level})`).join(", ")
    : "no elevated freeze/wind/flood flags";

  const summary = `DOC Watch ${input.asset} advice for ${input.locationName}: ${riskLabels}. Actions: ${actionList.join("; ")}.`;
  const human = summary;

  return {
    locationName: input.locationName,
    asset: input.asset,
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
