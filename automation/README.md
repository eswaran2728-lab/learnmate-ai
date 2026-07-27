# Eshan Creations — Automation Scaffolding

This folder holds the buildable pieces of the [master plan](./PLAN.md): a self-hosted
[n8n](https://n8n.io) stack that connects WhatsApp Cloud API, Gemini, TikTok Shop, Google Sheets,
and Telegram into one order pipeline.

Everything the *code* can do is here. Everything the *plan* needs a human for (Oracle Cloud
signup, Meta Business verification, TikTok Partner Center approval, new SIM card, etc.) stays a
checklist item in `PLAN.md` — no tool can do those steps on your behalf.

## Layout

```
automation/
├── PLAN.md                          # full master plan, kept for reference/tracking
├── docker-compose.yml                # self-hosted n8n (Phase 1)
├── .env.example                      # secrets n8n needs, copy to .env on the server
├── workflows/
│   ├── 01-whatsapp-ai-autoreply.json # Phase 2-3: WhatsApp -> Gemini -> reply -> ChatLog
│   └── 02-tiktok-order-pipeline.json # Phase 4-6: TikTok webhook -> Sheets -> Telegram
├── prompts/
│   └── gemini-system-prompt.md       # System prompt template for the AI Agent node
└── docs/
    └── sheets-schema.md              # Google Sheets tab layouts (ChatLog, Orders 2026, Paused)
```

## Setup order

1. **Phase 1 (server):** provision the Oracle Cloud VPS, install Docker, then run:
   ```bash
   cd automation
   cp .env.example .env   # fill in real values
   docker compose up -d
   ```
2. **Phase 2 (WhatsApp):** create the Meta app/number, wire the webhook to your n8n instance.
3. **Phase 3:** in n8n, import `workflows/01-whatsapp-ai-autoreply.json`, paste the system prompt
   from `prompts/gemini-system-prompt.md` into the AI Agent node, and point the Google Sheets
   nodes at your sheet (see `docs/sheets-schema.md` for the tab layout).
4. **Phase 4-6:** import `workflows/02-tiktok-order-pipeline.json`, fill in the TikTok
   app key/secret and shop cipher in n8n credentials, and point the Telegram node at your bot
   token + chat ID.
5. Test both workflows end-to-end with your own number/a sandbox order before going live.

## Golden rule

Additive builds only. Level 2+ upgrades from `PLAN.md` should be **new** workflow files in
`workflows/`, not edits to `01-whatsapp-ai-autoreply.json` or `02-tiktok-order-pipeline.json`
once those are live and working.
