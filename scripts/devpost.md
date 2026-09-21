# Devpost — DOC Watch

## Title
DOC Watch — Alexa+ MCP Agent Skill for dock & home weather

## Tagline
Voice-first watch, forecast, alert, and disseminate for docks, homes, and severe weather, powered by a crowd-sourced Ring sensor network.

## Primary track
**Alexa+** (only). AWS Builder mini-challenge and Open Source are layered on the same submission — not duplicate primary tracks.

## Elevator pitch
DOC Watch is a self-hosted MCP server (spec 2025-11-25, Streamable HTTP) that turns National Weather Service data, optional Ring-style sensors, and Grok narration into Alexa+ Agent Skill tools: current dock weather, alerts, pull-the-boat advice, sixty-second briefings, watches, and feature explainers. Tonight we ship the local brain and a labeled mock Ring mesh simulator. The worldwide live mesh is the post-win roadmap — not faked in the demo.

## Inspiration
Generic weather apps do not tell a Rochester dock owner whether to pull the boat tonight. DOC (Decentralized Operational Center) already lived as a weather agent idea; Alexa+ MCP skills finally give it a voice-native interface.

## What it does
- Live NWS conditions, 24h forecast, and alerts (Rochester / Long Pond defaults)
- Dock advice rules: freeze ≤36°F or freeze alert; wind gusts ≥25 mph; flood/heavy rain from NWS
- Spoken ~60s briefing (Grok if keyed, else template)
- Mock Ring sensors (temp, humidity, flood, freeze, cam motion context) with MOCK labels
- `set_watch` thresholds + `describe_features` mesh/join story
- Web playground + simulated Alexa+ chat

## How we built it
TypeScript + Express + official `@modelcontextprotocol/sdk` Streamable HTTP JSON transport. NWS via `api.weather.gov`. Optional xAI chat. Mock Ring service. Vitest for advice rules and tool shape.

## Built with
- MCP TypeScript SDK (`@modelcontextprotocol/sdk`) — Streamable HTTP 2025-11-25
- Node.js / Express / TypeScript / Zod
- National Weather Service API (`api.weather.gov`)
- xAI Grok (optional)
- Ring Partner-style mock sensors (MOCK_RING)
- Vitest
- HTML/JS web playground (Alexa+ simulation)

## Prior work / what changed during the hackathon
**Disclosed prior work:** WFAD, SWAFT, and DOC weather-agent patterns (NWS integration + voice briefing mindset).

**Built during the hackathon (significant update, not a locked-submission reskin):**
- New `docwatch` repo as Alexa+ MCP Agent Skill surface
- Streamable HTTP server + eight named tools
- Dock/home advice rule engine + structured JSON alerts
- Mock Ring mesh simulator (labeled) + join/features tool
- Web playground + Alexa+ chat sim
- Demo script, friction log, product feedback, MIT packaging

## Challenges
NWS User-Agent 403s; MCP session headers; resisting fake-live Ring claims; keeping the demo under three minutes with zero required API keys.

## Accomplishments
Runnable one-command demo; real MCP + NWS calls; mock-safe sensors; English 3-minute script; MIT open source.

## What's next
Live Ring Partner OAuth, capital-backed mesh ingestion, AWS-hosted MCP endpoint (Builder credits), multi-node watches with push alerts — still voice-first on Alexa+.

## Links
- Repo: `docwatch/` (publish to `https://github.com/Scrum723/docwatch`)
- License: MIT
- Demo script: `scripts/demo-script.md`
