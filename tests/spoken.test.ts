import { describe, expect, it } from "vitest";
import {
  buildAdviceHuman,
  buildSpokenBriefingTemplate,
  sanitizeSpokenText,
} from "../src/services/spoken.js";

describe("sanitizeSpokenText (shipped spoken polish)", () => {
  it("strips markdown, URLs, and typographic dashes", () => {
    const raw =
      "## Briefing\n**Cold** at the dock — see https://example.com/radar and `KROC`.\n- pull boat\nMore text.";
    const out = sanitizeSpokenText(raw);
    expect(out).not.toMatch(/https?:\/\//);
    expect(out).not.toMatch(/[#*`]/);
    expect(out).not.toMatch(/[\u2013\u2014]/);
    expect(out).toMatch(/Cold at the dock/);
    expect(out).toMatch(/KROC/);
  });
});

describe("buildSpokenBriefingTemplate (shipped template path)", () => {
  it("grounds a quiet briefing in NWS language without robotic DOC flags", () => {
    const text = buildSpokenBriefingTemplate({
      location: "Rochester / North Greece / Long Pond Road area",
      temp: 37,
      desc: "Clear",
      alertEvents: [],
      actions: ["stay weather-aware", "secure loose gear"],
      risks: [],
      observed: "Oct 22, 6:00 PM ET",
      station: "KROC",
      nextPeriod: "Tonight looks Mostly Clear, around 32 degrees with wind 5 mph",
    });
    expect(text).toMatch(/DOC Watch briefing/i);
    expect(text).toMatch(/National Weather Service/i);
    expect(text).toMatch(/KROC/);
    expect(text).toMatch(/37 degrees/);
    expect(text).toMatch(/no active National Weather Service alerts/i);
    expect(text).toMatch(/Freeze, wind, and flood look quiet/i);
    expect(text).not.toMatch(/DOC flags/i);
    expect(text).not.toMatch(/https?:\/\//);
    expect(text).not.toMatch(/[\u2013\u2014]/);
  });

  it("names active alerts and elevated risks when present", () => {
    const text = buildSpokenBriefingTemplate({
      location: "Buffalo / Lake Erie waterfront",
      temp: 28,
      desc: "Snow",
      alertEvents: ["Winter Weather Advisory"],
      actions: ["watch freeze", "pull small craft", "add lines"],
      risks: ["freeze", "wind"],
      observed: "Oct 22, 5:00 PM ET",
      station: "KBUF",
    });
    expect(text).toMatch(/Winter Weather Advisory/);
    expect(text).toMatch(/watching freeze, wind/i);
    expect(text).toMatch(/Suggested next steps/i);
  });
});

describe("buildAdviceHuman (shipped advice voice)", () => {
  it("speaks quietly when no elevated flags", () => {
    const text = buildAdviceHuman({
      locationName: "Fairport Canal / Erie Canal docks",
      asset: "boat",
      riskLabels: "no elevated freeze/wind/flood flags",
      hasElevated: false,
      actions: ["stay weather-aware", "secure loose gear"],
    });
    expect(text).toMatch(/look quiet/i);
    expect(text).toMatch(/Suggested next steps/i);
  });
});
