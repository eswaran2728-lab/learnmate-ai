# LearnMate AI

An AI-powered personal tutor platform for students aged 4–19, with dedicated portals for students, parents, and admins.

Created by **ESWARAN A/L Padmanathan**

## Features

- **AI Teacher chat** — personalised teaching powered by OpenAI GPT-4o, adapted to the student's age group and learning level
- **Diagnostic tests** — AI-generated assessments that place students at the right level per subject
- **Personal learning paths** — AI builds a study plan from diagnostic results
- **Daily missions** — auto-generated study targets with XP and streaks
- **Homework** — AI generates assignments, students submit, AI marks instantly with feedback
- **Achievements & gamification** — badges, XP, levels
- **Parent portal** — child progress, risk alerts, weekly reports
- **WhatsApp alerts** — homework and risk notifications to parents via WhatsApp Cloud API
- **Admin portal** — student management, curriculum, analytics dashboards

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| Database & Auth | Supabase (PostgreSQL + RLS) |
| AI | OpenAI GPT-4o |
| Messaging | WhatsApp Cloud API |
| Charts | Recharts |
| Hosting | Vercel |

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Open http://localhost:3000

### Database setup

Run `supabase/schema.sql` in the Supabase SQL Editor (or apply it as a migration). It creates all tables, RLS policies, storage buckets, and seed data (age groups, subjects, achievements).

### First admin account

1. Register at `/register` and choose any role
2. In Supabase Table Editor → `users`, set your row's `role` to `admin`

Full deployment instructions: see [DEPLOYMENT.md](DEPLOYMENT.md).

## Environment Variables

See [.env.example](.env.example). Required: Supabase URL + keys and `OPENAI_API_KEY`. WhatsApp variables are optional (parent alerts are skipped without them).
