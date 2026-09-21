# Product feedback — MCP, NWS, Grok, Ring docs

Answers framed for hackathon product-feedback prompts.

## Model Context Protocol (MCP)

**What worked**  
Official TypeScript SDK Streamable HTTP (`StreamableHTTPServerTransport` + `enableJsonResponse`) made a self-hosted Alexa+ Agent Skill path concrete. `tools/list` + typed `registerTool` is a clean contract for voice agents.

**What was confusing**  
Transport migration (SSE legacy vs Streamable HTTP 2025-11-25) is under-signposted in third-party tutorials. Session ID lifecycle is easy to get wrong on the first client.

**Ask**  
Ship a one-page “Alexa+ / voice agent self-hosted MCP” quickstart with copy-paste initialize → tools/list → tools/call over Streamable HTTP, including required `Accept` and `mcp-session-id` headers.

## National Weather Service (`api.weather.gov`)

**What worked**  
Free, no key, authoritative alerts — perfect for dock/home risk. GeoJSON alerts with `point=` are ideal for lat/lon agent tools.

**What was confusing**  
403s without User-Agent; multi-hop observation resolution; forecast hourly vs 12-hour periods.

**Ask**  
A “Current conditions in 3 calls” cookbook and a dedicated error body when User-Agent is missing (“descriptive User-Agent required”) instead of a bare 403.

## xAI Grok

**What worked**  
Strong plain-English risk narration for sixty-second briefings when a key is present.

**What was confusing**  
Model naming and “demo without a key” expectations for hackathon builders.

**Ask**  
Document an official “enhancer optional” pattern: structured JSON in → spoken prose out, with graceful degrade.

## Ring (Partner API / sensor docs)

**What worked**  
Clear separation in our product between environmental sensors (temp/humidity/flood/freeze) and cameras (motion/visual only).

**What was confusing**  
Public ecosystem noise (unofficial APIs) vs documented Partner scopes. OAuth too heavy for a same-night demo.

**Ask**  
A Partner “weather / home safety agent” scope pack + official **mock device pack** for hackathons so teams do not fake live camera weather networks.

## Alexa+

**What worked**  
Self-hosted MCP as Agent Skill substrate fits DOC Watch’s voice-first loop.

**Ask**  
Judge rubric checklist item: “Show `tools/list` on Streamable HTTP 2025-11-25” so demos converge on the same proof.
