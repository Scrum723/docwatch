# Friction log — DOC Watch hackathon (10% bonus)

Cryptic errors, missing docs, onboarding pain encountered while wiring MCP + NWS + optional Ring/Grok for Alexa+.

## MCP / TypeScript SDK

1. **Streamable HTTP vs deprecated SSE** — Older blog posts still show `/sse` + `/messages`. Spec 2025-11-25 wants a single `/mcp` endpoint (GET/POST/DELETE). Easy to ship the wrong transport and fail Alexa+ compliance.
2. **Session header required after initialize** — Forgetting `mcp-session-id` on follow-up `tools/list` yields a vague `Bad Request: No valid session ID` JSON-RPC error with little guidance for first-time Agent Skill authors.
3. **`Accept` header** — Clients that only send `application/json` can fail negotiation; docs emphasize `application/json, text/event-stream` but examples are easy to miss.
4. **`createMcpExpressApp` host binding** — Default localhost DNS-rebinding protection is good, but binding `0.0.0.0` without `allowedHosts` is a footgun when demoing from another device on the LAN.
5. **Zod v3 vs v4** — SDK accepts both; mixing `zod` import styles in examples causes `inputSchema` type confusion during registerTool.

## National Weather Service (`api.weather.gov`)

6. **User-Agent is mandatory** — Missing/empty UA often returns **403** with an HTML or short body that does not say “set a descriptive User-Agent.” Cryptic until you know the policy.
7. **Points → stations → observations chain** — Current conditions are not a single call. You must resolve `/points/{lat},{lon}`, then `observationStations`, then `/stations/{id}/observations/latest`. Easy to assume a simple “current weather” endpoint.
8. **Lat/lon precision** — Too many decimal places can 404 on `/points/`; rounding to 4 decimals is tribal knowledge.
9. **Hourly vs twice-daily forecast URLs** — `forecast` vs `forecastHourly` change period length; “24 hours” is ambiguous without checking which URL you used.
10. **Alerts `point=` parameter** — Works well, but empty feature collections look like “API broken” when it is actually a quiet weather day — UI must say “0 alerts” clearly.

## xAI Grok

11. **Optional enhancer pattern** — Without a documented fallback, demos die when `XAI_API_KEY` is unset. We templated briefings so Alexa+ still works offline-of-Grok.
12. **Model id churn** — Docs/examples disagree on current mini model names; wrong id → 404/400 mid-demo.

## Ring Partner / device docs

13. **Partner API vs consumer undocumented hacks** — Public “Ring API” gists are not Partner scopes. Risk of building on unofficial endpoints that violate ToS / fail review.
14. **Camera ≠ weather instrument** — Easy product mistake: treating outdoor cam as a temperature source. Docs do not loudly say “motion/visual context only” for weather agents — we labeled it explicitly in mock mode.
15. **OAuth onboarding length** — Live Partner OAuth cannot fit a 3-minute Alexa+ demo; mock-default is mandatory. Missing “mock mode” guidance in Partner quickstarts creates fake-live temptation.

## Alexa+ / Agent Skills framing

16. **“Working Agent Skill” vs self-hosted MCP** — Requirements accept self-hosted MCP, but onboarding language still centers catalog skills; judges need the `/mcp` endpoint called out in README in the first screen.
17. **Multi-track duplication rule** — Easy to accidentally submit the same repo to multiple primary tracks; we locked primary to Alexa+ and only *layer* AWS Builder + Open Source.

## Node / Windows onboarding

18. **PowerShell `mkdir -p a b c`** — Does not behave like bash; scaffold scripts fail silently or error oddly for cross-platform READMEs.
19. **`npm init` in the wrong directory** — One mistaken `cd` pollutes a parent folder’s `package.json` (happened during this build; recovered by moving into `docwatch/`).

## What we changed because of friction

- Default `MOCK_RING=true` with UI + log labels.
- Visible NWS errors (no silent empty success).
- Grok optional with template fallback.
- REST `/api/tools/:name` mirror so the web playground does not require a full MCP client during the 3-minute video.
- Rochester defaults so judges never type coordinates.
