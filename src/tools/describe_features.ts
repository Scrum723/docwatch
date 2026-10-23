import { z } from "zod";
import { toolResult } from "./types.js";

export const describeFeaturesSchema = {
  topic: z
    .string()
    .optional()
    .describe("Optional focus: mesh, flood_sensor, freeze_sensor, join, alexa, all"),
};

const FEATURES = {
  vision: `DOC Watch is the voice-first watch, forecast, alert, and disseminate layer for coastal advisories, homes, and severe weather. DOC means Decentralized Operational Center: the weather agent at the core. Advice always reports the nearest coastline for the place you ask about.`,
  mesh: `The Alexa+ sensor mesh vision: temperature, humidity, flood, freeze, and motion context sensors become nodes that ground DOC Watch actions. Tonight you get the local brain plus Alexa+ sensors proving the architecture. Capital-backed data sourcing and worldwide nodes are the post-win roadmap.`,
  flood_sensor: `Flood / water sensors detect moisture at shoreline hose bibs, maritime boxes, and basement utility rooms. When wet, DOC Watch raises a flood risk flag, pairs it with NWS flood/heavy-rain and coastal advisories, and recommends protective actions for Home, Mobile, Current location, or Maritime assets.`,
  freeze_sensor: `Freeze sensors watch near-freezing probe temps at shoreline plumbing and outdoor fixtures. DOC treats temp ≤ 36°F or NWS freeze/frost alerts as freeze risk and suggests secure gear, pull small craft, or move vehicles as appropriate for the asset.`,
  cameras: `Cameras contribute motion and visual context only. DOC Watch never invents live camera weather instruments. Temperature and precipitation still come from NWS (and dedicated temp/humidity/flood/freeze Alexa+ sensors).`,
  join: `How to join as a node (roadmap): authorize device scopes for sensor read + motion events, register your home or maritime location in DOC Watch, and contribute anonymized sensor status. Tonight: explore with Alexa+ sensors enabled.`,
  alexa: `Alexa+ Agent Skills call this self-hosted MCP server over Streamable HTTP (MCP spec 2025-11-25+). Tools expose current conditions, forecast, alerts, get_DOC_advice coastal advisories, spoken briefing, Alexa+ sensors, watches, and feature explainers: English voice-first.`,
  stack: `Data loop: NWS api.weather.gov (free) + Alexa+ sensor context + optional Grok plain-English risk copy → MCP tools → spoken briefing + structured JSON. Prior work: significant update to WFAD/SWAFT NWS + DOC agent patterns, disclosed as prior art.`,
};

export async function runDescribeFeatures(args: { topic?: string }) {
  const topic = (args.topic || "all").toLowerCase();
  const pick = (key: keyof typeof FEATURES) => FEATURES[key];

  let sections: string[];
  switch (topic) {
    case "mesh":
      sections = [pick("mesh"), pick("join")];
      break;
    case "flood":
    case "flood_sensor":
      sections = [pick("flood_sensor")];
      break;
    case "freeze":
    case "freeze_sensor":
      sections = [pick("freeze_sensor")];
      break;
    case "join":
      sections = [pick("join")];
      break;
    case "alexa":
      sections = [pick("alexa")];
      break;
    case "camera":
    case "cameras":
      sections = [pick("cameras")];
      break;
    default:
      sections = [
        pick("vision"),
        pick("mesh"),
        pick("flood_sensor"),
        pick("freeze_sensor"),
        pick("cameras"),
        pick("join"),
        pick("alexa"),
        pick("stack"),
      ];
  }

  const human = sections.join("\n\n");
  return toolResult({
    human,
    data: {
      tool: "describe_features",
      topic,
      features: FEATURES,
      selected: sections,
    },
  });
}
