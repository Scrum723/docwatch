# DOC Watch

**Tagline:** Voice-first coastal advisories, forecast, alert, and disseminate for homes, mobile, and maritime assets — always reporting the nearest coastline — powered by Alexa+ sensors and live NWS.

**DOC** = **D**ecentralized **O**perational **C**enter — the weather agent at the core.

Primary hackathon track: **Alexa+**. Layered: AWS Builder mini-challenge + Open Source (MIT).

## What ships tonight

A self-hosted **MCP server** (spec **2025-11-25+**, **Streamable HTTP**) that exposes coastal-advisory intelligence as Alexa+ Agent Skills, plus a thin web playground and a simulated Alexa+ chat.

Tonight you get the **local brain + simulator** that proves the architecture.

### Vision (roadmap)

DOC Watch turns Alexa+ temperature, humidity, flood, freeze, and motion-context sensors into nodes that ground coastal advisories for Home, Mobile, Current location, and Maritime assets. Capital-backed data sourcing and worldwide nodes are the **post-win roadmap**. Cameras = motion/visual context only — never treated as weather instruments.

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

Optional: copy `env.example` → `.env` and set `XAI_API_KEY` for Grok-enhanced briefings. **No keys required** for the demo (templated briefing + Alexa+ sensors).

Tests:

```bash
npm test
```

## Quick setup

```bash
git clone https://github.com/Scrum723/docwatch && cd docwatch
npm install
cp .env.example .env   # optional; runs with zero keys
npm start              # http://127.0.0.1:8787 (MCP at POST /mcp)
npm run smoke          # initialize + tools/list against the running server
npm run check          # typecheck + tests
```

Supported named locations: Rochester, Fairport, Long Pond (Greece), Buffalo, Sodus Point (playground dropdown + Alexa+ sim chips cover these). Any other place can be queried with `lat` and `lon`; unknown names return a clear tool error rather than another city's weather. Every reading cites the NWS station and observation time, and flags observations older than 90 minutes as possibly stale.

Spoken briefings and `get_DOC_advice` coastal advisories use calm plain English templates by default and always cite the nearest coastline. Set `XAI_API_KEY` to enhance narration with Grok; output is sanitized (no markdown, URLs, or typographic dashes) for Alexa+ playback.

## MCP tools (all eight)

| Tool | Purpose |
|------|---------|
| `get_current_conditions` | Live NWS `api.weather.gov` conditions (Rochester default) |
| `get_forecast` | NWS forecast, default 24h |
| `get_alerts` | Active NWS alerts |
| `get_DOC_advice` | Coastal advisories + nearest coastline; Home / Mobile / Current location / Maritime |
| `get_spoken_briefing` | ~60s spoken script (Grok or template) |
| `get_home_sensors` | Alexa+ sensors (temp / humidity / flood / freeze / motion) |
| `set_watch` | In-session wind/freeze/flood thresholds |
| `describe_features` | Mesh, sensors, how to join as a node |

Each tool returns **structured JSON** and a **short human string**.

## Core loop

NWS (free) → Alexa+ sensor context → optional Grok risk copy → MCP tools → spoken briefing + structured JSON alert.

**Defaults:** Rochester / North Greece / Long Pond Road area (`data/locations.json`).

## Prior work disclosure

Significant update to existing **WFAD** / **SWAFT** / **DOC** weather-agent patterns (NWS User-Agent + point/stations/alerts flow, DOC voice briefing mindset). This is **not** a reskin of a locked contest submission tree — new MCP Streamable HTTP Alexa+ skill surface, `get_DOC_advice` coastal advisories, Alexa+ sensors, and web Alexa+ playground built for this hackathon.

Public prior art references: `Scrum723/WFAD`, `Scrum723/SWAFT`; private DOC agent lineage.

## Hackathon compliance

- Working self-hosted MCP server (Alexa+ Agent Skill path)
- MCP protocol **2025-11-25** via official `@modelcontextprotocol/sdk` Streamable HTTP
- Real imports/calls: MCP SDK + `api.weather.gov` (see `src/server.ts`, `src/services/nws.ts`)
- English demo; MIT license; Alexa+ sensors labeled
- Primary track **Alexa+ only** (AWS Builder + Open Source layered on the same submission)

## Demo script

**Record tonight:** start at `scripts/recording-checklist.md`.  
Spoken lines: `scripts/demo-script.md` (≤3 minutes). Commands: `scripts/record-demo.md`.

## AWS Builder note

Layer AWS credits / Cost Management on the same Alexa+ submission for hosting follow-ons (ECS/App Runner/Lightsail). Tonight’s runnable path is local Node — no gold-plated AWS infra required to judge the MCP skill.

AWS console (credits): https://us-east-1.console.aws.amazon.com/costmanagement/home?region=us-east-2#/credits

## Repo layout

```
docwatch/
  README.md
  LICENSE
  package.json
  .env.example / env.example # same contents; copy either to .env
  data/locations.json
  src/server.ts              # MCP Streamable HTTP + web
  src/tools/*.ts             # eight tools
  src/services/{nws,grok,ring,advice,watch,locations,spoken}.ts
  src/prompts/{briefing,advice}.md
  web/{index,demo}.html
  scripts/{recording-checklist,demo-script,friction-log,product-feedback,devpost,record-demo,mcp-smoke}.md|.mjs
  tests/
```

## License

MIT — see `LICENSE`.
