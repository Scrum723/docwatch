# DOC Watch — 3-minute demo script

**Exact spoken lines + on-screen clicks. English. Total ≤ 3:00.**

---

### 0:00–0:15 — Problem

**Say:**  
“Docks and homes get wrecked by freeze, wind, and flood while generic weather apps stay generic. DOC Watch is voice-first dock and home intelligence for Alexa-plus.”

**Show:** Repo README title / tagline on screen.

---

### 0:15–0:40 — Start MCP server + tools list

**Do:**
```bash
cd docwatch
npm run dev
```
Open http://127.0.0.1:8787/demo.html → click **List tools**.

**Say:**  
“Self-hosted MCP server, Streamable HTTP, protocol twenty twenty-five eleven twenty-five. Eight Agent Skill tools.”

---

### 0:40–1:10 — Current conditions + alerts (Rochester)

**Do:** Select location **Rochester / North Greece / Long Pond** → click `get_current_conditions` → click `get_alerts`.

**Say:**  
“What’s the dock weather in Rochester right now? Live National Weather Service — no API key. Any freeze, flood, or severe risk?”

---

### 1:10–1:40 — Dock advice

**Do:** Asset = **boat** → click `get_dock_advice`.

**Say:**  
“Should I pull the boat, cover the dock, or move the van? DOC applies freeze at thirty-six degrees, wind gusts at twenty-five miles per hour, and NWS flood alerts — then returns actions.”

---

### 1:40–2:10 — Spoken briefing

**Do:** Click `get_spoken_briefing`. Scroll the human string. (Optional: read first 15 seconds aloud.)

**Say:**  
“Give me a sixty-second spoken briefing — Alexa-plus ready. Grok enhances if a key is present; otherwise templated copy still runs.”

---

### 2:10–2:35 — Mock home sensors

**Do:** Click `get_home_sensors`. Point at **MOCK MODE** badge / labeled sensors.

**Say:**  
“Mock Ring nodes: freeze sensor, humidity, flood probe, outdoor cam motion for visual context only — not a fake live camera weather network.”

---

### 2:35–2:55 — Alexa+ simulation

**Do:** Open http://127.0.0.1:8787/index.html → chip **“Alexa, what's my dock weather in Rochester?”** or type it.

**Say:**  
“Alexa, what’s my dock risk? Same MCP intelligence through a simulated Alexa-plus chat.”

---

### 2:55–3:00 — Close

**Say:**  
“MIT license, public GitHub, built tonight on WFAD and SWAFT prior work as DOC Watch — Decentralized Operational Center. Alexa-plus primary. Thank you.”

**Show:** LICENSE + README prior-work disclosure.
