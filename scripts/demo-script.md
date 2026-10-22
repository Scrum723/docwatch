# DOC Watch — 3-minute demo script

**Exact spoken lines + on-screen clicks. English. Total ≤ 3:00.**  
**Pre-flight:** `scripts/recording-checklist.md` · **Commands:** `scripts/record-demo.md`

Server should already be on `:8787`. If not: `cd C:\Users\cclot\docwatch` → `npm run dev`.

---

### 0:00–0:15 — Problem

**Say:**  
“Docks and homes get wrecked by freeze, wind, and flood while generic weather apps stay generic. DOC Watch is voice-first dock and home intelligence for Alexa-plus.”

**Show:** Repo README title / tagline on screen.

---

### 0:15–0:40 — MCP server + tools list

**Do:** Open http://127.0.0.1:8787/demo.html → click **List tools**.  
(Terminal may already show “DOC Watch listening… Streamable HTTP 2025-11-25” — flash it.)

**Say:**  
“Self-hosted MCP server, Streamable HTTP, protocol twenty twenty-five eleven twenty-five. Eight Agent Skill tools.”

---

### 0:40–1:10 — Current conditions + alerts (Rochester)

**Do:** Location **Rochester / North Greece / Long Pond** → `get_current_conditions` → `get_alerts`.

**Say:**  
“What’s the dock weather in Rochester right now? Live National Weather Service — no API key. Any freeze, flood, or severe risk?”

*(Quiet alerts or “no elevated flags” is real NWS — call the calm night out; still name the freeze / wind / flood rules.)*

---

### 1:10–1:40 — Dock advice

**Do:** Asset = **boat** → `get_dock_advice`.

**Say:**  
“Should I pull the boat, cover the dock, or move the van? DOC applies freeze at thirty-six degrees, wind at twenty-five miles per hour, and NWS flood alerts — then returns actions.”

---

### 1:40–2:10 — Spoken briefing

**Do:** Click `get_spoken_briefing`. Scroll the human string. (Optional: read the first ~15 seconds aloud.)

**Say (no Grok key — default):**  
“Give me a sixty-second spoken briefing — Alexa-plus ready. Templated copy runs with zero API keys.”

**Say (only if `XAI_API_KEY` is set):**  
“Give me a sixty-second spoken briefing — Alexa-plus ready. Grok enhances the narration when keyed.”

---

### 2:10–2:35 — Mock home sensors

**Do:** Click `get_home_sensors`. Point at **MOCK MODE** / **MOCK_RING** badge.

**Say:**  
“Mock Ring nodes: freeze sensor, humidity, flood probe, outdoor cam motion for visual context only — not a fake live camera weather network.”

---

### 2:35–2:55 — Alexa+ simulation

**Do:** Open http://127.0.0.1:8787/index.html → chip **“Dock weather”** (or “Alexa, what's my dock weather in Rochester?”).

**Say:**  
“Alexa, what’s my dock risk? Same MCP intelligence through a simulated Alexa-plus chat.”

---

### 2:55–3:00 — Close

**Say:**  
“MIT license, public GitHub, built on disclosed WFAD and SWAFT prior work as DOC Watch — Decentralized Operational Center. Alexa-plus primary. Thank you.”

**Show:** LICENSE + README prior-work disclosure.
