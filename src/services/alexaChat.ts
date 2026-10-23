/**
 * Local Alexa+ chat stand-in for the hackathon web simulator.
 *
 * Hackathon / Alexa+ docs: Alexa+ is the MCP *client* — it owns NLU, chat,
 * and spoken response. DOC Watch is the MCP *server* (tools + NWS facts).
 * Partner-preview Alexa+ devices are gated, so this module plays the Alexa+
 * chat role locally: pick tools, call runners, return one conversational reply.
 */

import { normalizeAsset, type Asset } from "./advice.js";
import { runGetAlerts } from "../tools/get_alerts.js";
import { runGetCurrentConditions } from "../tools/get_current_conditions.js";
import { runDescribeFeatures } from "../tools/describe_features.js";
import { runGetDocAdvice } from "../tools/get_DOC_advice.js";
import { runGetForecast } from "../tools/get_forecast.js";
import { runGetHomeSensors } from "../tools/get_home_sensors.js";
import { runGetSpokenBriefing } from "../tools/get_spoken_briefing.js";
import { runSetWatch } from "../tools/set_watch.js";

export type AlexaChatTurn = {
  role: "user" | "alexa";
  text: string;
};

export type AlexaChatResult = {
  reply: string;
  toolsCalled: Array<{ name: string; args: Record<string, unknown> }>;
  location: string;
  asset: Asset;
  /** True: this is the local Alexa+ chat sim, not a live Echo device session. */
  simulatedAlexaPlus: true;
};

function humanFromTool(result: any): string {
  return (
    (result?.structuredContent && result.structuredContent.human) ||
    result?.human ||
    (Array.isArray(result?.content) && result.content[0]?.text) ||
    JSON.stringify(result)
  );
}

function pickLocation(s: string, last: string): string {
  if (/\bbuffalo\b|\bbflo\b|\blake erie\b/.test(s)) return "buffalo";
  if (/\bfairport\b/.test(s)) return "fairport";
  if (/\bsodus\b/.test(s)) return "sodus";
  if (/\blong pond\b|\bgreece\b/.test(s)) return "long_pond";
  if (/\brochester\b|\bnorth greece\b|\broc\b/.test(s)) return "rochester";
  return last || "rochester";
}

function pickAsset(s: string): Asset {
  if (/\bmaritime\b|\bboat\b|\bdock\b|\bcraft\b/.test(s)) return "maritime";
  if (/\bmobile\b|\bvan\b|\bvehicle\b|\bcar\b/.test(s)) return "mobile";
  if (/\bcurrent location\b|\bhere\b|\bmy location\b/.test(s)) return "current_location";
  if (/\bhome\b|\bhouse\b/.test(s)) return "home";
  return "maritime";
}

type Plan = { name: string; args: Record<string, unknown> };

function planTools(utterance: string, location: string, asset: Asset): Plan[] {
  const s = utterance.toLowerCase();
  if (s.includes("sensor") || s.includes("alexa+") || s.includes("humidity") || s.includes("motion")) {
    return [{ name: "get_home_sensors", args: { location } }];
  }
  if (s.includes("brief") || s.includes("sixty") || s.includes("60") || s.includes("spoken")) {
    return [{ name: "get_spoken_briefing", args: { location, seconds: 60 } }];
  }
  if (s.includes("feature") || s.includes("mesh") || s.includes("join") || s.includes("how does")) {
    return [{ name: "describe_features", args: { topic: s.includes("flood") ? "flood_sensor" : "all" } }];
  }
  if (s.includes("watch") && (s.includes("alert") || s.includes("threshold") || s.includes("set"))) {
    return [{ name: "set_watch", args: { location, windMph: 25, freezeTempF: 36, flood: true } }];
  }
  if (
    s.includes("pull") ||
    s.includes("cover") ||
    s.includes("boat") ||
    s.includes("advice") ||
    s.includes("should i") ||
    s.includes("coastal") ||
    s.includes("maritime") ||
    s.includes("risk") ||
    s.includes("freeze") ||
    s.includes("flood") ||
    s.includes("twelve") ||
    s.includes("12h") ||
    /\b12\b/.test(s)
  ) {
    return [{ name: "get_DOC_advice", args: { location, asset } }];
  }
  if (s.includes("alert")) {
    return [{ name: "get_alerts", args: { location } }];
  }
  if (s.includes("forecast") || s.includes("tonight") || s.includes("tomorrow") || s.includes("hourly")) {
    return [{ name: "get_forecast", args: { location, hours: 24 } }];
  }
  // Default Alexa+ coastal weather turn: conditions then advice.
  return [
    { name: "get_current_conditions", args: { location } },
    { name: "get_DOC_advice", args: { location, asset } },
  ];
}

async function runTool(name: string, args: Record<string, unknown>): Promise<any> {
  switch (name) {
    case "get_current_conditions":
      return runGetCurrentConditions(args as any);
    case "get_forecast":
      return runGetForecast(args as any);
    case "get_alerts":
      return runGetAlerts(args as any);
    case "get_DOC_advice":
    case "get_dock_advice":
      return runGetDocAdvice(args as any);
    case "get_spoken_briefing":
      return runGetSpokenBriefing(args as any);
    case "get_home_sensors":
      return runGetHomeSensors(args as any);
    case "set_watch":
      return runSetWatch(args as any);
    case "describe_features":
      return runDescribeFeatures(args as any);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * One Alexa+ chat turn: user utterance → tool plan → conversational reply.
 */
export async function runAlexaPlusChat(input: {
  message: string;
  lastLocation?: string;
  history?: AlexaChatTurn[];
}): Promise<AlexaChatResult> {
  const message = (input.message || "").trim();
  if (!message) {
    return {
      reply: "I'm Alexa-plus with DOC Watch. Ask about coastal advisories, forecast, or Alexa-plus sensors.",
      toolsCalled: [],
      location: input.lastLocation || "rochester",
      asset: "maritime",
      simulatedAlexaPlus: true,
    };
  }

  const location = pickLocation(message.toLowerCase(), input.lastLocation || "rochester");
  const asset = pickAsset(message.toLowerCase());
  const plan = planTools(message, location, asset);
  const toolsCalled: AlexaChatResult["toolsCalled"] = [];
  const parts: string[] = [];

  for (const step of plan) {
    toolsCalled.push(step);
    const result = await runTool(step.name, step.args);
    parts.push(humanFromTool(result));
  }

  const body = parts.filter(Boolean).join(" ");
  // Alexa+ owns the spoken chat framing; tools supply grounded facts.
  const reply = body
    ? `Here's what DOC Watch has for you. ${body}`
    : "I couldn't get a DOC Watch reading just now. Try again in a moment.";

  return {
    reply,
    toolsCalled,
    location,
    asset,
    simulatedAlexaPlus: true,
  };
}
