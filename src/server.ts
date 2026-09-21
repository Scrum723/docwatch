/**
 * DOC Watch MCP Streamable HTTP server
 * Protocol: MCP 2025-11-25+ via @modelcontextprotocol/sdk StreamableHTTPServerTransport
 * Alexa+ Agent Skill primary track — self-hosted MCP endpoint at POST /mcp
 */

import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import cors from "cors";
import express, { type Request, type Response } from "express";
import { registerAllTools, TOOL_NAMES } from "./tools/index.js";
import { runGetAlerts } from "./tools/get_alerts.js";
import { runGetCurrentConditions } from "./tools/get_current_conditions.js";
import { runDescribeFeatures } from "./tools/describe_features.js";
import { runGetDockAdvice } from "./tools/get_dock_advice.js";
import { runGetForecast } from "./tools/get_forecast.js";
import { runGetHomeSensors } from "./tools/get_home_sensors.js";
import { runGetSpokenBriefing } from "./tools/get_spoken_briefing.js";
import { runSetWatch } from "./tools/set_watch.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";

function createDocWatchServer(): McpServer {
  const server = new McpServer(
    {
      name: "docwatch",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        logging: {},
      },
    }
  );
  registerAllTools(server);
  return server;
}

// Stateful Streamable HTTP (JSON response mode) — protocol 2025-11-25
const transports: Record<string, StreamableHTTPServerTransport> = {};

const app = createMcpExpressApp({ host: HOST });
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Static web playground + Alexa+ sim
app.use(express.static(join(__dirname, "../web")));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "DOC Watch",
    mcp: {
      transport: "streamable-http",
      protocol: "2025-11-25",
      endpoint: "/mcp",
      tools: TOOL_NAMES,
    },
    mockRing: (process.env.MOCK_RING ?? "true") !== "false",
  });
});

app.get("/api/tools", (_req, res) => {
  res.json({ tools: TOOL_NAMES });
});

/** Thin REST mirror so the web playground can call the same tool runners without a full MCP client. */
app.post("/api/tools/:name", async (req: Request, res: Response) => {
  const name = req.params.name;
  const args = (req.body ?? {}) as Record<string, unknown>;
  try {
    let result;
    switch (name) {
      case "get_current_conditions":
        result = await runGetCurrentConditions(args as any);
        break;
      case "get_forecast":
        result = await runGetForecast(args as any);
        break;
      case "get_alerts":
        result = await runGetAlerts(args as any);
        break;
      case "get_dock_advice":
        result = await runGetDockAdvice(args as any);
        break;
      case "get_spoken_briefing":
        result = await runGetSpokenBriefing(args as any);
        break;
      case "get_home_sensors":
        result = await runGetHomeSensors(args as any);
        break;
      case "set_watch":
        result = await runSetWatch(args as any);
        break;
      case "describe_features":
        result = await runDescribeFeatures(args as any);
        break;
      default:
        res.status(404).json({ error: `Unknown tool: ${name}`, tools: TOOL_NAMES });
        return;
    }
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[api/tools/${name}]`, message);
    res.status(500).json({ error: message, human: `Tool ${name} failed: ${message}` });
  }
});

app.post("/mcp", async (req: Request, res: Response) => {
  // MCP Streamable HTTP — Amazon Alexa+ Agent Skill transport
  console.log(`[MCP] POST /mcp method=${req.body?.method ?? "n/a"}`);
  try {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: (id) => {
          console.log(`[MCP] session initialized: ${id}`);
          transports[id] = transport;
        },
      });
      const server = createDocWatchServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: No valid session ID provided" },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("[MCP] error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.get("/mcp", (_req, res) => {
  res.status(405).set("Allow", "POST, DELETE").json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed. Use POST for Streamable HTTP JSON mode.",
    },
    id: null,
  });
});

app.delete("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  try {
    await transports[sessionId].handleRequest(req, res);
    delete transports[sessionId];
  } catch (error) {
    console.error("[MCP] DELETE error:", error);
    if (!res.headersSent) res.status(500).send("Error processing session termination");
  }
});

app.listen(PORT, HOST, () => {
  console.log(`DOC Watch listening on http://${HOST}:${PORT}`);
  console.log(`MCP Streamable HTTP (2025-11-25) endpoint: POST http://${HOST}:${PORT}/mcp`);
  console.log(`Web playground: http://${HOST}:${PORT}/demo.html`);
  console.log(`Alexa+ sim:     http://${HOST}:${PORT}/index.html`);
  console.log(`Tools: ${TOOL_NAMES.join(", ")}`);
  console.log(`MOCK_RING=${process.env.MOCK_RING ?? "true"}`);
});
