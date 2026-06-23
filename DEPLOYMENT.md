# LearnMate AI — Deployment Guide

Created by **ESWARAN A/L Padmanathan**

---

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- An OpenAI account with API key
- A WhatsApp Business account (for WhatsApp alerts)
- Vercel account (recommended for deployment)

---

## Step 1: Install Node.js

Download from https://nodejs.org (choose LTS version)

---

## Step 2: Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Copy your **Project URL** and **anon key** from Settings > API
3. Copy your **service role key** from Settings > API
4. Open the **SQL Editor** in Supabase dashboard
5. Paste the entire contents of `supabase/schema.sql` and run it
6. This creates all 20+ tables, RLS policies, and default data

---

## Step 3: Configure Environment Variables

Edit `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-proj-...
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=any_random_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 4: Install Dependencies

```bash
cd learnmate-ai
npm install
```

---

## Step 5: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Step 6: Create Admin Account

1. Register at `/register`
2. Choose "Admin" role
3. Go to Supabase Table Editor > `users`
4. Find your user and set `role` = `admin`

---

## Step 7: Deploy to Vercel (Production)

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to Vercel at https://vercel.com

Add all environment variables in Vercel project settings.

---

## Step 8: Set Up WhatsApp (Optional)

1. Create a Meta Business account
2. Set up WhatsApp Business API
3. Get your Phone Number ID and permanent access token
4. Set your webhook URL to: `https://your-domain.com/api/whatsapp`
5. Use your `WHATSAPP_VERIFY_TOKEN` to verify the webhook

---

## Step 9: Enable Supabase Storage

In Supabase dashboard:
1. Go to Storage
2. Two buckets are auto-created by schema: `homework` and `avatars`
3. Set appropriate permissions if needed

---

## User Flow

1. **Student registers** → `/register` → selects Student role → fills age, school level
2. **Diagnostic test** → `/student/diagnostic` → selects subjects → AI generates questions
3. **AI analyses results** → creates learning levels and personal learning path
4. **Student dashboard** → `/student/dashboard` → sees levels, missions, homework
5. **AI Teacher chat** → `/student/chat` → asks questions, gets personalised teaching
6. **Daily missions** → `/student/missions` → study targets generated daily
7. **Homework** → `/student/homework` → AI generates, student submits, AI marks instantly
8. **Parent portal** → `/parent/dashboard` → sees child progress, risk status, homework alerts

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 App Router + TypeScript |
| Styling | Tailwind CSS + custom components |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| AI Teacher | OpenAI GPT-4o |
| WhatsApp | WhatsApp Cloud API |
| Charts | Recharts |
| Hosting | Vercel (recommended) |
| PWA | manifest.json + next-pwa |

---

## Folder Structure

```
learnmate-ai/
├── src/
│   ├── app/
│   │   ├── (auth)/login, register, onboarding
│   │   ├── student/dashboard, chat, diagnostic, missions, homework, achievements, learn
│   │   ├── parent/dashboard, reports
│   │   ├── admin/dashboard, students, curriculum, analytics
│   │   └── api/ai/chat, diagnostic, homework, mark, learning-path
│   ├── components/
│   │   ├── layout/ (StudentSidebar, ParentSidebar, AdminSidebar)
│   │   └── student/ (Dashboard, Chat, Missions, Homework)
│   ├── lib/
│   │   ├── supabase/ (client, server, middleware)
│   │   ├── openai/ (client, prompts)
│   │   └── whatsapp/ (client)
│   ├── types/index.ts
│   └── lib/utils.ts
├── supabase/schema.sql
├── public/manifest.json
└── .env.local
```

---

*Created by ESWARAN A/L Padmanathan*
