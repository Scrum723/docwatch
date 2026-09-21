# DOC Watch

**Tagline:** Voice-first watch, forecast, alert, and disseminate for docks, homes, and severe weather, powered by a crowd-sourced Ring sensor network.

**DOC** = **D**ecentralized **O**perational **C**enter — the weather agent at the core.

Primary hackathon track: **Alexa+**. Layered: AWS Builder mini-challenge + Open Source (MIT).

## What ships tonight

A self-hosted **MCP server** (spec **2025-11-25+**, **Streamable HTTP**) that exposes dock/home weather intelligence as Alexa+ Agent Skills, plus a thin web playground and a simulated Alexa+ chat.

Tonight you get the **local brain + simulator** that proves the architecture.

### Vision (roadmap — not fake-live)

DOC Watch turns every authorized Ring camera, temperature, humidity, flood, and freeze sensor into a node in a global dock-weather mesh. Capital-backed data sourcing, live Partner OAuth, and worldwide nodes are the **post-win roadmap**. This repo does **not** claim a live worldwide Ring video weather network. Cameras = motion/visual context only. Default `MOCK_RING=true` with clearly labeled mock sensors.

## Judge path (≈5 minutes)

```bash
cd docwatch
npm install
npm run dev
```

Then open:

- Health: http://127.0.0.1:8787/health
- Tool playground: http://127.0.0.1:8787/demo.html
- Alexa+ sim: http://127.0.0.1:8787/index.html
- MCP endpoint: `POST http://127.0.0.1:8787/mcp` (Streamable HTTP, JSON mode, protocol 2025-11-25)

Optional: copy `env.example` → `.env` and set `XAI_API_KEY` for Grok-enhanced briefings. **No keys required** for the demo (templated briefing + mock Ring).

Tests:

```bash
npm test
```

## MCP tools (all eight)

| Tool | Purpose |
|------|---------|
| `get_current_conditions` | Live NWS `api.weather.gov` conditions (Rochester default) |
| `get_forecast` | NWS forecast, default 24h |
| `get_alerts` | Active NWS alerts |
| `get_dock_advice` | Freeze ≤36°F / wind ≥25 mph / flood rules → actions |
| `get_spoken_briefing` | ~60s spoken script (Grok or template) |
| `get_home_sensors` | Mock Ring sensors (labeled) unless Partner live enabled |
| `set_watch` | In-session wind/freeze/flood thresholds |
| `describe_features` | Mesh, sensors, how to join as a node |

Each tool returns **structured JSON** and a **short human string**.

## Core loop

NWS (free) → optional mock Ring status → optional Grok risk copy → MCP tools → spoken briefing + structured JSON alert.

**Defaults:** Rochester / North Greece / Long Pond Road area (`data/locations.json`).

## Prior work disclosure

Significant update to existing **WFAD** / **SWAFT** / **DOC** weather-agent patterns (NWS User-Agent + point/stations/alerts flow, DOC voice briefing mindset). This is **not** a reskin of a locked contest submission tree — new MCP Streamable HTTP Alexa+ skill surface, dock-advice rules, mock Ring mesh simulator, and web Alexa+ playground built for this hackathon.

Public prior art references: `Scrum723/WFAD`, `Scrum723/SWAFT`; private DOC agent lineage.

## Hackathon compliance

- Working self-hosted MCP server (Alexa+ Agent Skill path)
- MCP protocol **2025-11-25** via official `@modelcontextprotocol/sdk` Streamable HTTP
- Real imports/calls: MCP SDK + `api.weather.gov` (see `src/server.ts`, `src/services/nws.ts`)
- English demo; MIT license; mock Ring clearly labeled
- Primary track **Alexa+ only** (AWS Builder + Open Source layered on the same submission)

## Demo script

See `scripts/demo-script.md` (≤3 minutes). Recording notes: `scripts/record-demo.md`.

## AWS Builder note

Layer AWS credits / Cost Management on the same Alexa+ submission for hosting follow-ons (ECS/App Runner/Lightsail). Tonight’s runnable path is local Node — no gold-plated AWS infra required to judge the MCP skill.

AWS console (credits): https://us-east-1.console.aws.amazon.com/costmanagement/home?region=us-east-2#/credits

## Repo layout

```
docwatch/
  README.md
  LICENSE
  package.json
  env.example
  data/locations.json
  src/server.ts              # MCP Streamable HTTP + web
  src/tools/*.ts             # eight tools
  src/services/{nws,grok,ring,advice,watch,locations}.ts
  src/prompts/{briefing,advice}.md
  web/{index,demo}.html
  scripts/{demo-script,friction-log,product-feedback,devpost,record-demo}.md
  tests/
```

## License

MIT — see `LICENSE`.
