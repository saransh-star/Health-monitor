# 🍏 NutriSnap — AI-Powered Food & Nutrition Tracker

NutriSnap is a modern, mobile-first web app that lets users snap photos of their meals and instantly receive nutritional breakdowns (calories, macros, health score, and healthy alternatives) powered by Google Gemini AI, with persistent tracking and offline queue support.

---

## ✨ Features

- 📸 **Multimodal Food Scanner**: Snap one or multiple photos of meals; Google Gemini AI vision identifies foods and calculates nutritional details.
- ✍️ **Natural Language Text Logging**: Describe meals manually if a photo isn't available.
- ⚡ **Offline-Ready Queue**: If AI is busy or internet connection drops, photos are saved locally in IndexedDB to retry later.
- 📊 **Dynamic Dashboard**: Calorie ring, daily macronutrient breakdown (protein, carbs, fat, fiber), and logging streaks.
- 📈 **Weekly Trends & AI Coach**: 7-day intake charts and personalized AI-generated weekly coaching insights.
- ⚖️ **Weight & Goal Tracking**: Log daily weight, monitor progress toward goals, and compute caloric targets.
- 🔒 **Secure Auth**: Powered by Clerk with PostgreSQL (Neon) persistence.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions) & React 19
- **Styling**: Tailwind CSS v4 & Vanilla CSS glassmorphic tokens
- **AI / LLM**: Google Gemini 3 Flash Preview (`@google/genai`)
- **Database**: PostgreSQL (Neon Database / Vercel Postgres) via `pg`
- **Auth**: Clerk (`@clerk/nextjs`)
- **Client Queue**: IndexedDB
- **Charts**: Chart.js / Recharts

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed
- PostgreSQL database (e.g. Neon, Supabase, or local)
- Google AI Studio API key (`GOOGLE_API_KEY`)
- Clerk account API keys

### 2. Configure Environment Variables
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
GOOGLE_API_KEY=AIzaSy...
```

### 3. Install & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on desktop or mobile.

---

## 📖 System Documentation & Architecture

For in-depth technical details, database schemas, API routes, and architectural diagrams, see:
👉 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
