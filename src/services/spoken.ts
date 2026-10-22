/**
 * Spoken / conversational copy helpers for DOC Watch.
 * Keeps Alexa+ briefings NWS-grounded, plain English, and free of markdown/URLs.
 */

export type SpokenBriefingArgs = {
  location: string;
  temp: number | null;
  desc: string | null;
  alertEvents: string[];
  actions: string[];
  risks: string[];
  observed?: string;
  nextPeriod?: string;
  station?: string | null;
};

/** Strip markdown, URLs, and typographic dashes from model or template copy. */
export function sanitizeSpokenText(text: string): string {
  let s = text.replace(/\r\n/g, "\n").trim();
  s = s.replace(/```[\s\S]*?```/g, " ");
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/^\s*#{1,6}\s+/gm, "");
  s = s.replace(/^\s*[-*•]\s+/gm, "");
  s = s.replace(/https?:\/\/\S+/gi, "");
  s = s.replace(/www\.\S+/gi, "");
  s = s.replace(/[\u2013\u2014]/g, ", "); // en/em dash
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** Natural ~60s briefing when Grok is unset. */
export function buildSpokenBriefingTemplate(args: SpokenBriefingArgs): string {
  const obsBit =
    args.temp != null
      ? `The latest National Weather Service observation${args.observed ? `, ${args.observed}` : ""}${
          args.station ? ` at station ${args.station}` : ""
        }, shows ${args.desc ?? "conditions"} around ${args.temp} degrees. `
      : "Current National Weather Service observations are unavailable right now. ";

  const nextBit = args.nextPeriod ? `Looking ahead, ${args.nextPeriod}. ` : "";

  const alertBit =
    args.alertEvents.length > 0
      ? `Active alerts include ${args.alertEvents.slice(0, 3).join(", ")}. `
      : "There are no active National Weather Service alerts for this spot right now. ";

  const riskBit =
    args.risks.length > 0
      ? `I am watching ${args.risks.join(", ")} over the next twelve hours. `
      : "Freeze, wind, and flood look quiet in the near term. ";

  const acts = args.actions.slice(0, 3);
  const actionBit =
    acts.length > 0
      ? `Suggested next steps: ${acts.join("; ")}. `
      : "Stay weather-aware and check back if conditions change. ";

  return sanitizeSpokenText(
    `Here is your DOC Watch briefing for ${args.location}. ` +
      obsBit +
      nextBit +
      alertBit +
      riskBit +
      actionBit +
      `Want the hourly forecast or alert details next?`
  );
}

/** Conversational dock/home advice line (template path). */
export function buildAdviceHuman(args: {
  locationName: string;
  asset: string;
  riskLabels: string;
  hasElevated: boolean;
  actions: string[];
}): string {
  const actionLine = args.actions.slice(0, 5).join("; ");
  if (!args.hasElevated) {
    return sanitizeSpokenText(
      `For your ${args.asset} at ${args.locationName}, things look quiet right now. ` +
        `No elevated freeze, wind, or flood flags from the National Weather Service. ` +
        `Suggested next steps: ${actionLine}.`
    );
  }
  return sanitizeSpokenText(
    `For your ${args.asset} at ${args.locationName}, DOC Watch sees ${args.riskLabels}. ` +
      `Suggested next steps: ${actionLine}.`
  );
}
