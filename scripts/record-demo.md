# Exact commands to run and record the video tonight

**Start here:** `scripts/recording-checklist.md` (one-pager). Spoken lines: `scripts/demo-script.md`.

## 0. Already running? (usual case tonight)

Server was left up for recording:

- Health: http://127.0.0.1:8787/health → `ok:true`, `mockRing:true`
- Playground: http://127.0.0.1:8787/demo.html
- Alexa+ sim: http://127.0.0.1:8787/index.html
- MCP: `POST http://127.0.0.1:8787/mcp` (Streamable HTTP **2025-11-25**)

If health fails, start section 1. Otherwise skip to section 3.

## 1. Terminal (left half of screen)

```powershell
cd C:\Users\cclot\docwatch
npm install
npm run dev
```

Wait for:

```
DOC Watch listening on http://127.0.0.1:8787
MCP Streamable HTTP (2025-11-25) endpoint: POST http://127.0.0.1:8787/mcp
```

## 2. Optional MCP / unit smoke (second terminal, before recording)

```powershell
cd C:\Users\cclot\docwatch
npm test
node scripts/mcp-smoke.mjs
```

Expect: **11/11** tests · MCP smoke prints `OK` and eight tool names.

## 3. Browser tabs (right half)

1. http://127.0.0.1:8787/demo.html  
2. http://127.0.0.1:8787/index.html  
3. `README.md` in editor (prior work + MIT) — flash at open and close

## 4. Record

- Follow `scripts/demo-script.md` spoken lines.
- Keep the **Alexa+ sensors** label visible on sensors.
- Cap at **3:00** English.
- Tonight’s Rochester live shape (numbers drift): ~Clear, mid-30s °F, light wind. Quiet alerts / “no elevated flags” is fine — still show the freeze/wind/flood rule line.

## 5. Grok (optional — do not block)

- No `XAI_API_KEY` required. Briefing uses templated copy and still demo-ready.
- If a key is set in `.env`, say “Grok enhances the briefing”; otherwise say “templated sixty-second briefing, Alexa-plus ready.”

## 6. AWS credits (Builder mini-challenge layer)

Optional flash only (do **not** burn demo time provisioning):  
https://us-east-1.console.aws.amazon.com/costmanagement/home?region=us-east-2#/credits

Say once if you have spare seconds: “AWS Builder layered on Alexa-plus for post-demo hosting.”

## 7. If NWS is slow

Keep talking — UI/tools show visible errors if unreachable; do not invent weather.
