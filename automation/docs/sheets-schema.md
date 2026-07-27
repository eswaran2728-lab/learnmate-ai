# Google Sheets Schema

Create one spreadsheet ("Eshan Creations Ops" or similar) with three tabs. Put its ID in
`GOOGLE_SHEETS_SPREADSHEET_ID` (`.env`) and reference the same ID in every Google Sheets node
inside both workflow JSON files once imported into n8n.

## Tab: `Orders 2026`

Used by `workflows/02-tiktok-order-pipeline.json`.

| Date | Order ID | Product | Qty | Amount (RM) | Buyer | Phone | Address | Status | Tracking No | Printed? | Shipped? |
|------|----------|---------|-----|--------------|-------|-------|---------|--------|-------------|----------|----------|

- `Order ID` is the dedupe key — the workflow looks up this column before appending.
- `Printed?` / `Shipped?` default to `No` on insert; update manually (or via a Level 2 workflow
  later) as you work through orders.
- When a year's orders grow the sheet too large, either add a `Month` column or split into a new
  tab per month (Phase 5 checklist) — keep whichever the workflow's Append node targets in sync.

## Tab: `ChatLog`

Used by `workflows/01-whatsapp-ai-autoreply.json`.

| Date | Number | Message | Reply |
|------|--------|---------|-------|

- One row per inbound WhatsApp message, whether the bot replied, was skipped (paused), or a
  `#manual`/`#auto` command was handled.

## Tab: `Paused`

Used by `workflows/01-whatsapp-ai-autoreply.json` for the manual-takeover toggle.

| Number | PausedAt |
|--------|----------|

- A row present here means the bot stays silent for that WhatsApp number.
- `#manual` appends a row; `#auto` deletes it.
- You (the owner) can also add/remove rows here by hand if you want to pre-pause a number.
