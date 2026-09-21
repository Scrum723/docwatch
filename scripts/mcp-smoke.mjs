/**
 * MCP Streamable HTTP smoke: initialize + tools/list against a running DOC Watch server.
 * Usage: node scripts/mcp-smoke.mjs [baseUrl]
 */
const base = (process.argv[2] || "http://127.0.0.1:8787").replace(/\/$/, "");
const mcp = `${base}/mcp`;

const headers = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
};

async function rpc(body, sessionId) {
  const h = { ...headers };
  if (sessionId) h["mcp-session-id"] = sessionId;
  const res = await fetch(mcp, { method: "POST", headers: h, body: JSON.stringify(body) });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { res, json, sessionId: res.headers.get("mcp-session-id") || sessionId };
}

const init = await rpc({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "docwatch-smoke", version: "1.0.0" },
  },
});

if (!init.res.ok) {
  console.error("initialize failed", init.res.status, init.json);
  process.exit(1);
}

const sessionId = init.sessionId;
const protocol = init.json?.result?.protocolVersion;
console.log(JSON.stringify({ protocolVersion: protocol, sessionId }, null, 2));

await rpc(
  { jsonrpc: "2.0", method: "notifications/initialized" },
  sessionId
);

const tools = await rpc(
  { jsonrpc: "2.0", id: 2, method: "tools/list" },
  sessionId
);

const names = (tools.json?.result?.tools || []).map((t) => t.name).sort();
console.log(JSON.stringify({ tools: names, raw: tools.json }, null, 2));

const required = [
  "get_current_conditions",
  "get_forecast",
  "get_alerts",
  "get_dock_advice",
  "get_spoken_briefing",
  "get_home_sensors",
  "set_watch",
  "describe_features",
];
const missing = required.filter((n) => !names.includes(n));
if (missing.length || !protocol || protocol < "2025-11-25") {
  console.error("FAIL", { missing, protocol });
  process.exit(1);
}
console.log("OK");
