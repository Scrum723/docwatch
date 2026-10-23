import { describe, expect, it, vi } from "vitest";

vi.mock("../src/tools/get_current_conditions.js", () => ({
  runGetCurrentConditions: vi.fn(async () => ({
    structuredContent: { human: "Right now at Rochester it is Clear, about 40°F." },
  })),
}));
vi.mock("../src/tools/get_DOC_advice.js", () => ({
  runGetDocAdvice: vi.fn(async () => ({
    structuredContent: {
      human: "Coastal advisories for your maritime at Rochester. Nearest coastline: Lake Ontario.",
    },
  })),
}));
vi.mock("../src/tools/get_spoken_briefing.js", () => ({
  runGetSpokenBriefing: vi.fn(async () => ({
    structuredContent: { human: "Here is your DOC Watch briefing for Rochester." },
  })),
}));
vi.mock("../src/tools/get_home_sensors.js", () => ({
  runGetHomeSensors: vi.fn(async () => ({
    structuredContent: { human: "[Alexa+ sensors] Alexa+ sensors at Rochester." },
  })),
}));
vi.mock("../src/tools/get_forecast.js", () => ({
  runGetForecast: vi.fn(async () => ({
    structuredContent: { human: "Over the next 24 hours at Buffalo, Mostly Clear." },
  })),
}));
vi.mock("../src/tools/get_alerts.js", () => ({
  runGetAlerts: vi.fn(async () => ({
    structuredContent: { human: "No active alerts." },
  })),
}));
vi.mock("../src/tools/set_watch.js", () => ({
  runSetWatch: vi.fn(async () => ({
    structuredContent: { human: "Watch set." },
  })),
}));
vi.mock("../src/tools/describe_features.js", () => ({
  runDescribeFeatures: vi.fn(async () => ({
    structuredContent: { human: "DOC Watch mesh and Alexa+ sensors." },
  })),
}));

import { runAlexaPlusChat } from "../src/services/alexaChat.js";
import { runGetDocAdvice } from "../src/tools/get_DOC_advice.js";
import { runGetSpokenBriefing } from "../src/tools/get_spoken_briefing.js";

describe("runAlexaPlusChat (Alexa+ chat sim → MCP tools)", () => {
  it("routes coastal advice through get_DOC_advice and returns Alexa+ reply", async () => {
    const out = await runAlexaPlusChat({
      message: "Alexa, coastal advisories for Rochester?",
    });
    expect(out.simulatedAlexaPlus).toBe(true);
    expect(out.location).toBe("rochester");
    expect(out.toolsCalled.map((t) => t.name)).toContain("get_DOC_advice");
    expect(runGetDocAdvice).toHaveBeenCalled();
    expect(out.reply).toMatch(/DOC Watch/i);
    expect(out.reply).toMatch(/Lake Ontario|Coastal advisories/i);
  });

  it("routes briefing requests to get_spoken_briefing", async () => {
    const out = await runAlexaPlusChat({
      message: "Give me a sixty-second briefing.",
      lastLocation: "rochester",
    });
    expect(out.toolsCalled).toEqual([
      expect.objectContaining({ name: "get_spoken_briefing" }),
    ]);
    expect(runGetSpokenBriefing).toHaveBeenCalled();
    expect(out.reply).toMatch(/briefing/i);
  });
});
