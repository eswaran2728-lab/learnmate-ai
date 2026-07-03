# Toonify 🎬✨

Turn short videos into cartoons with AI. Users upload (or record) a clip up to 30s, pick a style
preset (Pixar 3D, Anime, Comic Book, Watercolor), and get back a stylized video they can save or
share.

```
toonify/
├── backend/    Node.js + Express API — upload, FFmpeg pipeline, AI style transfer, job queue
├── mobile/     Expo (React Native) app — iOS & Android from one codebase
└── supabase/   Postgres schema + storage bucket (auth, jobs, usage metering)
```

## Status: Phase 1 + 2 complete ✅

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Scaffolding: Expo app w/ all screens, backend w/ health check, Supabase schema | ✅ done |
| 2 | Upload → frame extraction → style transfer → reassembly, working end-to-end | ✅ done (smoke-tested) |
| 3 | Real job queue (BullMQ + Redis), job rows in Postgres | ⬜ next |
| 4 | More presets, before/after preview, share polish | ⬜ |
| 5 | Monetization: server-side limits, RevenueCat/Stripe | ⬜ |
| 6 | Cost guardrails & analytics | ⬜ |

## Run it locally

### 1. Backend

```bash
cd backend
npm install          # ffmpeg-static is optional; falls back to system ffmpeg on PATH
cp .env.example .env # defaults work out of the box (mock provider, local storage)
npm run dev          # http://localhost:4000
```

Prove the whole pipeline end-to-end (generates a test video, uploads, polls, verifies output):

```bash
npm run smoke
```

By default the backend uses the **mock style provider** — a local FFmpeg cartoon-ish filter per
frame, so the full pipeline runs with zero API cost. To use real AI style transfer, set in `.env`:

```
STYLE_PROVIDER=replicate
REPLICATE_API_TOKEN=r8_...
REPLICATE_MODEL=owner/model            # any img2img model that takes { image, prompt }
```

### 2. Mobile app

```bash
cd mobile
npm install
npx expo start       # scan QR with Expo Go, or press i / a for simulator
```

No config needed in development: the app auto-targets port 4000 on the machine running the Expo
dev server. For accounts, copy `.env.example` → `.env` and fill in the Supabase keys.

### 3. Supabase (optional until Phase 3)

Create a project, then run `supabase/schema.sql` in the SQL editor. It creates profiles (with
auto-provisioning on signup), the jobs table, a monthly-usage view, and a private
`toonify-videos` storage bucket. Point the backend at it with `STORAGE_DRIVER=supabase` +
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, and the app with the `EXPO_PUBLIC_SUPABASE_*` vars.

## Architecture notes

**Pipeline** (`backend/src/pipeline/process.ts`):
video → frames at reduced fps → stylize each frame → reassemble (original audio muxed back) →
storage → app polls `GET /api/jobs/:id`.

**Provider abstraction** (`backend/src/providers/styleTransfer.ts`): the AI backend is one
interface (`stylizeFrame`). Swapping Replicate for another provider — or a video-native model —
touches only `providers/`, selected by the `STYLE_PROVIDER` env var.

**Cost guardrails** (all env-tunable, enforced server-side):
- `MAX_VIDEO_SECONDS=30` — duration cap, validated with ffprobe on upload
- `PROCESS_FPS=12` — frames are extracted at 12fps, not source fps (a 30s clip = 360 API calls
  instead of 900 at 30fps)
- `MAX_FRAME_WIDTH=720` — frames are downscaled before stylizing
- `FRAME_CONCURRENCY=2` — bounded parallelism keeps burst spend predictable

## ⚠️ Known risk: temporal consistency (flagged per brief)

Frame-by-frame img2img stylization processes each frame independently, which commonly causes
**flicker** between frames. The mock provider (deterministic filters) doesn't show this, but a
real diffusion-based img2img model will. **Before investing in Phases 4+**, run a real clip
through a Replicate img2img model and judge the flicker. If quality is unacceptable, evaluate
video-native style-transfer models on Replicate instead — thanks to the provider abstraction
that swap is contained to `backend/src/providers/`. (A video-native provider would bypass frame
extraction entirely; the pipeline already keeps that step isolated.)

## API surface

- `GET /health` — provider/limits info
- `GET /api/styles` — style presets (drives the picker in the app)
- `POST /api/jobs` — multipart `video` + `styleId`, returns `202 { job }`
- `GET /api/jobs/:id` — `{ status: queued|processing|done|failed, progress, resultUrl, error }`
- `GET /media/...` — finished videos (local storage driver only)
