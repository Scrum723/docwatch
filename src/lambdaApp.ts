/**
 * Slim Express app for AWS Lambda — no MCP SDK StreamableHTTP transport.
 * Serves web UI, /health, /api/*, and JSON Streamable-HTTP /mcp.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { runAlexaPlusChat } from "./services/alexaChat.js";
import { awsVoiceHealth, synthesizePollySpeech, transcribePcm16 } from "./services/awsVoice.js";
import { handleLambdaMcpPost } from "./lambdaMcp.js";
import { TOOL_NAMES, runTool } from "./lambdaRunTool.js";

export const app = express();
app.use(
  cors({
    origin: true,
    exposedHeaders: ["mcp-session-id", "Mcp-Session-Id"],
    allowedHeaders: ["Content-Type", "Accept", "mcp-session-id", "MCP-Protocol-Version"],
  })
);
app.use(express.json({ limit: "16mb" }));

const webRoot = [join(process.cwd(), "web"), join("/var/task", "web")].find((p) => existsSync(p));
if (webRoot) app.use(express.static(webRoot));

app.get("/health", async (_req, res) => {
  const awsVoice = await awsVoiceHealth().catch((err) => ({
    region: process.env.AWS_REGION || "us-east-1",
    polly: false,
    transcribe: false,
    error: err instanceof Error ? err.message : String(err),
  }));
  res.json({
    ok: true,
    service: "DOC Watch",
    host: "aws-lambda",
    mcp: {
      transport: "streamable-http-json",
      protocol: "2025-11-25",
      endpoint: "/mcp",
      tools: TOOL_NAMES,
    },
    mockRing: (process.env.MOCK_RING ?? "true") !== "false",
    alexaSensors: true,
    awsVoice,
  });
});

app.get("/api/tools", (_req, res) => {
  res.json({ tools: TOOL_NAMES });
});

app.post("/api/alexa-chat", async (req: Request, res: Response) => {
  try {
    const message = String(req.body?.message ?? req.body?.text ?? "").trim();
    const lastLocation = req.body?.lastLocation ? String(req.body.lastLocation) : undefined;
    const history = Array.isArray(req.body?.history) ? req.body.history : undefined;
    const result = await runAlexaPlusChat({ message, lastLocation, history });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/alexa-chat]", message);
    res.status(500).json({
      error: message,
      reply: `Alexa-plus chat could not complete that turn. ${message}`,
      simulatedAlexaPlus: true,
      toolsCalled: [],
    });
  }
});

app.post("/api/tts", async (req: Request, res: Response) => {
  try {
    const text = String(req.body?.text ?? req.body?.message ?? "").trim();
    const result = await synthesizePollySpeech(text);
    if (!result.ok) {
      res.status(502).json(result);
      return;
    }
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/tts]", message);
    res.status(500).json({ ok: false, error: message, provider: "amazon-polly" });
  }
});

app.post("/api/stt", async (req: Request, res: Response) => {
  try {
    const b64 = String(req.body?.pcm16Base64 ?? "").trim();
    if (!b64) {
      res.status(400).json({
        ok: false,
        error: "pcm16Base64 required",
        provider: "amazon-transcribe",
        fallback: "browser-stt",
      });
      return;
    }
    const sampleRate = Number(req.body?.sampleRate) || 16000;
    const pcm = Buffer.from(b64, "base64");
    const result = await transcribePcm16(pcm, sampleRate);
    if (!result.ok) {
      const needsSub = /subscription/i.test(result.error);
      res.status(needsSub ? 503 : 422).json({
        ...result,
        fallback: "browser-stt",
        hint: needsSub
          ? "Enable Amazon Transcribe once in AWS Console, or use browser STT / Demo v2v."
          : undefined,
      });
      return;
    }
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/stt]", message);
    res.status(500).json({
      ok: false,
      error: message,
      provider: "amazon-transcribe",
      fallback: "browser-stt",
    });
  }
});

app.post("/api/tools/:name", async (req: Request, res: Response) => {
  const name = String(req.params.name);
  try {
    const result = await runTool(name, (req.body ?? {}) as Record<string, unknown>);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[api/tools/${name}]`, message);
    res.status(404).json({ error: message, human: `Tool ${name} failed: ${message}` });
  }
});

app.post("/mcp", async (req, res) => {
  await handleLambdaMcpPost(req, res);
});

app.get("/mcp", (_req, res) => {
  res.json({
    ok: true,
    service: "DOC Watch",
    transport: "streamable-http-json",
    protocol: "2025-11-25",
    tools: TOOL_NAMES,
  });
});
