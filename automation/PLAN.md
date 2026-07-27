# Eshan Creations — AI Automation Master Plan (A to Z)

**Goal:** Fully automated order + customer system. Customer chats on WhatsApp → AI replies → TikTok orders auto-logged to Google Sheets → reminders sent to you. Built free, upgraded over time.

**Stack (Free):** n8n (Oracle Cloud Always Free VPS) + WhatsApp Cloud API + Gemini API (free tier) + TikTok Shop Open API + Google Sheets + Telegram (free alerts)

**Monthly cost:** ~RM0–5

---

## PART 1 — CORE BUILD (Phase 1–6)

### Phase 1: Server Setup (Day 1–2)
- [ ] Create Oracle Cloud account (Always Free tier — ARM VPS, 4 core / 24GB RAM, free forever)
- [ ] Launch Ubuntu 22.04 instance
- [ ] Install Docker + Docker Compose
- [ ] Run n8n container with persistent volume
- [ ] Point subdomain (n8n.yourdomain.com) via Cloudflare, enable SSL
- [ ] Fallback if Oracle signup fails: Cloudflare Tunnel + home PC (testing only)

### Phase 2: WhatsApp Business Cloud API (Day 2–4)
- [ ] Meta Business account + business verification
- [ ] NEW phone number for business line (never use personal number — ban risk)
- [ ] Create Meta Developer app → add WhatsApp product
- [ ] Get permanent access token + Phone Number ID
- [ ] Connect n8n WhatsApp Business Cloud node
- [ ] Set Meta webhook → n8n webhook URL
- [ ] Test: send/receive one message

### Phase 3: AI Auto-Reply Workflow (Day 4–7)
**Flow:** WhatsApp Trigger → Filter (customer only) → AI Agent (Gemini) → WhatsApp Send → Log to Sheets

- [ ] Get free Gemini API key (aistudio.google.com)
- [ ] n8n AI Agent node + Gemini model + conversation memory buffer
- [ ] System prompt contents:
  - Full product catalog + tier pricing (RM30–229+)
  - Shipping info, delivery time, COD/payment methods
  - FAQ answers (material, size, custom orders, festival pre-orders)
  - Tone: friendly Tanglish, short messages, calm trust-based style (same as content style)
  - Goal: guide customer toward order, collect: product + qty + address
  - Escalation rule: if customer angry/complex → "Boss will reply you shortly 🙏" + alert you
- [ ] Manual takeover: keyword "#manual" pauses bot for that customer (store paused numbers in Sheet tab)
- [ ] "#auto" resumes bot
- [ ] Log every chat to Google Sheets tab "ChatLog" (date, number, message, reply)

### Phase 4: TikTok Shop API (Day 7–12) — HARDEST PART
- [ ] Register at TikTok Shop Partner Center (partner.tiktokshop.com)
- [ ] Create app → request Order scope
- [ ] Authorize Eshan Creations shop
- [ ] Subscribe ORDER_STATUS_CHANGE webhook → n8n webhook URL
- [ ] n8n Code node: HMAC-SHA256 request signing for TikTok API calls
- [ ] On webhook fire → call Get Order Detail API → extract:
  - Order ID, buyer name, product(s), qty, amount, address, phone, status
- [ ] Filter: only process status = CONFIRMED / AWAITING_SHIPMENT

### Phase 5: Auto-Log to Google Sheets (Day 12–13)
- [ ] Sheet "Orders 2026" columns:
  `Date | Order ID | Product | Qty | Amount (RM) | Buyer | Phone | Address | Status | Tracking No | Printed? | Shipped?`
- [ ] n8n Google Sheets node → append row per order
- [ ] Duplicate check: skip if Order ID already exists
- [ ] Monthly tab auto-created (Code node) OR one big sheet with month column
- [ ] Download as .xlsx anytime = your Excel record

### Phase 6: Order Alerts to You (Day 13–14)
- [ ] Create Telegram bot (@BotFather) — 100% free alerts
- [ ] n8n Telegram node → message on every new order:
  `🛒 NEW ORDER! Murugan Statue x1 — RM159 — Kavitha (Ipoh) — Order #12345`
- [ ] Optional: WhatsApp template to your number instead (~RM0.05/msg)
- [ ] Test full pipeline end-to-end with a real test order

---

## PART 2 — UPGRADE ROADMAP (Build Later, In Order)

### Level 2 — Operations Automation
1. **Daily 9PM Sales Summary** (Telegram/WhatsApp): today's orders, revenue, best seller, pending shipments
2. **Print Queue Alert**: order comes in → checks "Printed?" column → reminds you which statues to start on the A1 Mini / P1S, sorted by order date
3. **Shipping Status → Customer**: TikTok webhook on shipped → auto WhatsApp to customer "Your order dah ship! 📦 Tracking: [no]"
4. **Auto Follow-Up**: customer asked price but no order in 24h → gentle Tanglish follow-up message
5. **Review Request**: 3 days after delivery status → auto message asking for TikTok review + photo

### Level 3 — Sales & Marketing Automation
6. **Customer CRM Sheet**: auto-build customer database — repeat buyers, total spent, last order, festival buyers (Aadi, Thaipusam, Deepavali tags)
7. **Festival Broadcast Campaigns**: opted-in customers get pre-festival promo via WhatsApp template (Aadi month = peak season push)
8. **Abandoned Interest Recovery**: weekly scan of ChatLog for "asked but never bought" → win-back message with small offer
9. **Best-Seller Auto-Restock Signal**: product sells 3x in a week → alert to print stock in advance
10. **Price Quote Generator**: customer sends custom statue request → AI asks size/design → generates quote from your pricing rules

### Level 4 — Content Automation (connects to @EshanCreations)
11. **Auto Content Ideas**: weekly Telegram message — 5 Tanglish TikTok script ideas based on what sold this week (uses your eshan-creation-content skill style)
12. **Metricool Integration**: n8n → Metricool API → auto-schedule posts at best times
13. **Order Milestone Content**: "100th order this month" → auto-generate celebration post draft
14. **Comment-to-DM Funnel**: TikTok comment keywords → auto DM price list (when TikTok API allows)

### Level 5 — Multi-Business Expansion
15. **Eshan Suvai Module**: duplicate workflows for food brand — same engine, second WhatsApp number/sheet
16. **BeltFlow Integration**: Silambam academy fee reminders via same WhatsApp infrastructure
17. **Kiosk Business Ready**: when food kiosk with master launches — daily sales report automation from day one
18. **Unified Dashboard PWA** (Next.js + Vercel, same as ICMS pattern): live orders, revenue charts, chat monitor, bot pause/resume buttons — all businesses one screen

### Level 6 — Advanced AI
19. **Upgrade Gemini → Claude API** for better Tanglish quality once revenue justifies (~RM30–50/month)
20. **Voice Note Replies**: AI-generated Tamil voice replies for older customers (TTS)
21. **Image Understanding**: customer sends photo of deity → AI identifies → suggests matching product
22. **AI Retention Coach pattern** (from BeltFlow spec): monthly analysis — which customers going cold, what to do
23. **Invoice/Receipt PDF**: auto-generate branded receipt PDF per order, sent via WhatsApp

---

## PART 3 — RULES & SAFETY

- **Never** run auto-reply on your personal WhatsApp number
- WhatsApp broadcast/marketing messages ONLY to customers who opted in (Meta bans hard)
- Keep bot replies short — long AI paragraphs feel robotic, kills your trust-based style
- Always keep #manual takeover working — never let bot handle complaints alone
- Backup n8n workflows (export JSON) monthly + Google Sheet auto-backup
- Test every workflow with your own number before going live
- TikTok API tokens expire — set n8n workflow to auto-refresh tokens

---

## PART 4 — BUILD ORDER (What to do first)

```
Week 1:  Phase 1 + 2 (server + WhatsApp connected)
Week 2:  Phase 3 (AI replies live) — START SIMPLE, FAQ only
Week 2–3: Phase 4 + 5 (TikTok → Sheets)
Week 3:  Phase 6 (alerts) → CORE SYSTEM DONE ✅
Month 2: Level 2 upgrades (daily summary, print queue, shipping updates)
Month 3: Level 3 (CRM, festival campaigns)
Month 4+: Levels 4–6 as businesses grow
```

**Golden rule (your usual pattern):** additive builds only. Each upgrade is a new n8n workflow — never rebuild working ones.

---

## PART 5 — WHAT TO PREPARE BEFORE BUILDING

1. New SIM card for business WhatsApp number
2. Debit/credit card for Oracle Cloud verification (RM0 charged)
3. Product catalog written out: every product, price tier, sizes, materials
4. FAQ list: top 20 questions customers actually ask in DMs
5. Your Tanglish reply examples (10–15 real DM replies you've sent) — for the AI system prompt
6. TikTok Shop seller account in good standing (needed for Partner Center approval)
