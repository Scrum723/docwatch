# RECORD NOW — DOC Watch demo checklist

**Deadline context:** Record ≤3:00 English video for amazonappdev2026 (Alexa+ primary).  
**Repo tip:** `afdabb0` · **Local server:** already on `http://127.0.0.1:8787` (`npm run dev`).

---

## Pre-roll (60 seconds, off camera)

- [ ] Terminal shows: `DOC Watch listening on http://127.0.0.1:8787`
- [ ] Open tabs: `demo.html` · `index.html` · README (prior work + MIT)
- [ ] Optional smoke: `node scripts/mcp-smoke.mjs` → `OK`
- [ ] Health: http://127.0.0.1:8787/health → `ok:true`, `mockRing:true`, protocol `2025-11-25`
- [ ] Screen layout: terminal left, browser right; font large enough for judges
- [ ] Mic check; speak English; timer visible or phone timer to 2:55

**Tonight’s live NWS snapshot (Rochester) — expect this shape, numbers can drift:**
- Conditions: Clear ~37°F, light wind (~8 mph) — quiet night is still a strong demo
- Dock advice: may say **no elevated freeze/wind/flood flags** + stay weather-aware (rules still shown in your spoken line)
- Alerts: often **none** (say “quiet on alerts” — that is valid NWS)
- Sensors: **[MOCK MODE]** must stay on screen

---

## Click path (follow `demo-script.md`)

| Time | Tab | Action | Say (short) |
|------|-----|--------|-------------|
| 0:00 | README | Title | Problem + DOC Watch voice-first |
| 0:15 | demo | **List tools** | MCP Streamable HTTP 2025-11-25 · eight tools |
| 0:40 | demo | `get_current_conditions` → `get_alerts` | Live NWS, no API key |
| 1:10 | demo | asset=boat → `get_dock_advice` | Freeze 36°F / wind 25 mph / flood rules |
| 1:40 | demo | `get_spoken_briefing` | Sixty-second Alexa+ briefing (template if no Grok key) |
| 2:10 | demo | `get_home_sensors` | Point at **MOCK** badge — labeled mock Ring |
| 2:35 | index | chip “Dock weather” | Same intelligence via Alexa+ sim |
| 2:55 | LICENSE/README | Flash MIT + GitHub | Close: Alexa+ primary · MIT · thank you |

---

## Hard rules on camera

1. **MOCK Ring** stays labeled — never imply a live worldwide Ring weather network.
2. Cap **3:00**. Prefer cutting Alexa sim fluff over cutting MOCK or MCP tools list.
3. If NWS is slow, keep talking; do not invent temperatures.
4. Primary track wording: **Alexa+ only** (AWS Builder / Open Source layered).

---

## After record → Devpost

1. Upload public/unlisted YouTube or Vimeo.
2. Paste answers from `scripts/devpost.md`.
3. Link repo: https://github.com/Scrum723/docwatch (MIT).
4. Attach or point judges at `scripts/friction-log.md` + `scripts/product-feedback.md` for the 10% bonus prompts.

---

## If the server died

```powershell
cd C:\Users\cclot\docwatch
npm run dev
```

Full command notes: `scripts/record-demo.md` · Spoken lines: `scripts/demo-script.md`.
