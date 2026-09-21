import { z } from "zod";
import { toolResult } from "./types.js";

export const describeFeaturesSchema = {
  topic: z
    .string()
    .optional()
    .describe("Optional focus: mesh, flood_sensor, freeze_sensor, join, alexa, all"),
};

const FEATURES = {
  vision: `DOC Watch is the voice-first watch, forecast, alert, and disseminate layer for docks, homes, and severe weather. DOC means Decentralized Operational Center — the super-powered weather agent at the core.`,
  mesh: `The Ring sensor mesh vision: every authorized Ring camera, temperature, humidity, flood, and freeze sensor becomes a node in a crowd-sourced dock-weather mesh. Tonight you get the local brain plus a clearly labeled MOCK simulator proving the architecture. Capital-backed data sourcing, live Partner OAuth, and worldwide nodes are the post-win roadmap — not claimed live tonight.`,
  flood_sensor: `Flood / water sensors detect moisture at hose bibs, bilge-adjacent dock boxes, and basement utility rooms. When wet, DOC Watch raises a flood risk flag, pairs it with NWS flood/heavy-rain alerts, and recommends pull-small-craft / move-van / add-lines style actions.`,
  freeze_sensor: `Freeze sensors watch near-freezing probe temps at docks and outdoor plumbing. DOC treats temp ≤ 36°F or NWS freeze/frost alerts as freeze risk: cover dock, add lines, pull small craft, watch freeze.`,
  cameras: `Cameras contribute motion and visual context only. DOC Watch never invents live camera weather instruments. A motion event can corroborate activity at the dock; temperature and precipitation still come from NWS (and dedicated temp/humidity/flood/freeze sensors).`,
  join: `How to join as a node (roadmap): authorize Ring Partner scopes for device read + motion events, register your dock/home location in DOC Watch, keep MOCK mode off only after OAuth, and contribute anonymized sensor status to the mesh. Tonight: explore with MOCK_RING=true.`,
  alexa: `Alexa+ Agent Skills call this self-hosted MCP server over Streamable HTTP (MCP spec 2025-11-25+). Tools expose current conditions, forecast, alerts, dock advice, spoken briefing, home sensors, watches, and feature explainers — English voice-first.`,
  stack: `Data loop: NWS api.weather.gov (free) + optional mock/live Ring sensor status + optional Grok plain-English risk copy → MCP tools → spoken briefing + structured JSON alert. Prior work: significant update to WFAD/SWAFT NWS + DOC agent patterns, disclosed as prior art — not a locked-submission reskin.`,
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
