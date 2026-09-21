# Exact commands to run and record the video tonight

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

## 2. Optional MCP initialize smoke (second terminal, before recording)

```powershell
cd C:\Users\cclot\docwatch
node --input-type=module -e "
const base='http://127.0.0.1:8787/mcp';
const init=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'demo',version:'1.0.0'}}})});
const sid=init.headers.get('mcp-session-id');
const initBody=await init.json();
console.log('protocol', initBody.result?.protocolVersion, 'session', sid);
const list=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream','mcp-session-id':sid},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'notifications/initialized'})});
await list.text();
const tools=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json, text/event-stream','mcp-session-id':sid},body:JSON.stringify({jsonrpc:'2.0',id:3,method:'tools/list'})});
console.log(JSON.stringify(await tools.json(),null,2));
"
```

## 3. Browser tabs (right half)

1. http://127.0.0.1:8787/demo.html  
2. http://127.0.0.1:8787/index.html  
3. README.md in editor (prior work + MIT)

## 4. Record

- Follow `scripts/demo-script.md` spoken lines exactly.
- Keep MOCK badge visible when showing sensors.
- Cap at 3:00.

## 5. AWS credits (Builder mini-challenge layer)

Open (while saying “AWS Builder layered on Alexa-plus for post-demo hosting”):  
https://us-east-1.console.aws.amazon.com/costmanagement/home?region=us-east-2#/credits

Do **not** block the demo on AWS provisioning tonight.

## 6. If NWS is slow

Keep talking — responses show visible errors if unreachable; do not invent weather.
