# Content Rawards

AI-powered video editing and content repurposing platform. Turn long videos into short-form content for TikTok, Instagram Reels, YouTube Shorts, and more.

## Quick Start

```bash
cd content-rawards
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo login: `demo@contentrawards.com` / `demo1234`

## Setup

1. Copy `.env.local.example` to `.env.local`
2. Fill in your API keys (optional — app works with mock data without them)
3. Run `npm run dev`

## Environment Variables

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Whisper transcription + GPT-4 clip analysis |
| `NEXTAUTH_SECRET` | Auth session signing |
| `AWS_*` | S3 video storage (optional, uses local uploads/ if not set) |

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/dashboard` | Upload videos, view projects |
| `/workspace/[id]` | Video editor with AI clips, timeline, export |
| `/projects` | Project management |
| `/auth/signin` | Sign in |

## API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/projects` | GET / POST | List / create projects |
| `/api/videos/upload` | POST | Upload file or YouTube URL |
| `/api/videos/analyze` | POST | Run AI analysis, generate clips |
| `/api/clips` | GET / PATCH / DELETE | Clip CRUD |

## Architecture

```
Next.js 14 App Router
├── app/                  Pages + API routes
├── components/
│   ├── ui/               Button, Badge, Card, Input, ProgressBar
│   ├── landing/          Navbar, Hero, Features, Pricing, FAQ
│   ├── dashboard/        Sidebar, UploadZone, VideoCard
│   └── workspace/        VideoPlayer, Timeline, ClipCard, AITaskPanel
├── lib/
│   ├── db.ts             File-based JSON store (swap for Prisma in prod)
│   ├── ai.ts             OpenAI Whisper + GPT-4 (mock fallback)
│   └── utils.ts          Helpers
└── types/                TypeScript interfaces
```

## Production Checklist

- [ ] Replace `lib/db.ts` with Prisma + PostgreSQL
- [ ] Add AWS S3 for video storage
- [ ] Add FFmpeg worker for real video export
- [ ] Add real NextAuth provider (Google OAuth, etc.)
- [ ] Add job queue (BullMQ / Inngest) for background processing
- [ ] Set `NEXTAUTH_SECRET` to a strong random value
