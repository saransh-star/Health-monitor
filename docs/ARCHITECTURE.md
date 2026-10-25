# NutriSnap — System Architecture & Technical Documentation

NutriSnap is an AI-powered, mobile-first Progressive Web Application (PWA) designed to track daily nutrition effortlessly. Users snap photos of meals, and Google Gemini AI multimodal vision analyzes the food items, portions, calories, macronutrients, and health scores, persisting them to PostgreSQL with offline-first fallback queues.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Client Layer (PWA)                              │
│  - Next.js 15 App Router (React 19) + Tailwind CSS v4                       │
│  - Clerk Auth SDK (@clerk/nextjs)                                           │
│  - Canvas Image Compression (1024x1024, JPEG 0.85)                          │
│  - IndexedDB ("NutriSnapDB" -> pendingUploads offline queue)                │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
                       │ REST API Requests             │ Server Actions
                       ▼                               ▼
┌──────────────────────────────────────┐     ┌────────────────────────────────┐
│           Route Handlers             │     │      Next.js Server Actions    │
│  - POST /api/analyze                 │     │  - initDb()                    │
│  - POST /api/analyze-text            │     │  - getProfile() / saveProfile()│
│  - POST /api/get-insight             │     │  - getAllMeals() / saveMeal()  │
└──────────────────┬───────────────────┘     │  - getWeightHistory() / ...    │
                   │                         │  - getDashboardStats()         │
                   ▼                         │  - getWeeklyStats()            │
┌──────────────────────────────────────┐     └───────────────┬────────────────┘
│            AI Vision Engine          │                     │
│  - Google Gemini 3 Flash Preview     │                     │ pg Pool Query
│  - Multimodal Vision & JSON Schema   │                     ▼
└──────────────────────────────────────┘     ┌────────────────────────────────┐
                                             │      PostgreSQL Database       │
                                             │  - profiles (user profile)     │
                                             │  - meals (JSONB nutrition)     │
                                             │  - weights (weight logs)       │
                                             └────────────────────────────────┘
```

---

## 2. End-to-End User & Data Flows

### A. Photo Capture & Analysis Flow
1. **Capture/Upload**: The user captures photos via the camera or selects files from gallery in `src/app/scan/page.js`.
2. **Client-Side Compression**: `compressImage()` downscales the image to a maximum dimension of 1024x1024 via HTML5 Canvas and converts it to a JPEG data URL (quality: 0.85).
3. **EXIF Timestamp Extraction**: The file's `lastModified` timestamp is converted to client local time (`YYYY-MM-DDThh:mm`) so meals photographed earlier are logged at the correct time.
4. **Multimodal API Request**: The Base64 strings are posted to `/api/analyze` along with any optional text description provided by the user.
5. **Gemini Vision Processing**: Google GenAI invokes `gemini-3-flash-preview` with a strict JSON system prompt to extract foods, portions, calories, protein, carbs, fat, fiber, health score, weight loss tip, and healthy alternative.
6. **Offline Fallback Queue**: If the AI API returns a 429 (rate limit) or 503 (busy/overloaded), the compressed images are automatically stored in IndexedDB (`NutriSnapDB.pendingUploads`). The user can retry with one tap once connection or quota recovers.
7. **Confirmation & Persistence**: The user reviews the breakdown in `NutritionCard` and clicks "Log This Meal", which invokes the `saveMeal` server action to store the JSONB payload into PostgreSQL.

### B. Dashboard & Macro Calculation Flow
1. **Timezone Offset Transmission**: When loading `src/app/page.js` or `src/app/log/page.js`, the client's `getTimezoneOffset()` is passed to `getDashboardStats()` and `getWeeklyStats()`.
2. **Aggregation**: The server calculates the consumed calories and macros for the client's local "today".
3. **Streak Computation**: The server iterates backward day-by-day (up to 365 days) checking for at least one meal logged on each consecutive calendar day.

---

## 3. Database Schema

Tables are automatically initialized via `initDb()` in `src/app/actions.js`:

```sql
-- 1. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
    user_id VARCHAR(255) PRIMARY KEY,     -- Clerk User ID
    name VARCHAR(255),                    -- User display name
    daily_calorie_target INT,             -- Daily calorie target (e.g. 1800 kcal)
    current_weight FLOAT,                 -- Current weight in kg/lbs
    goal_weight FLOAT,                    -- Target weight
    height FLOAT,                         -- Height in cm
    activity_level VARCHAR(50),           -- sedentary | light | moderate | active | very-active
    unit VARCHAR(10)                      -- 'kg' or 'lbs'
);

-- 2. Logged Meals
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,        -- Clerk User ID
    data JSONB NOT NULL,                  -- Nutritional breakdown JSON object
    timestamp TIMESTAMP DEFAULT NOW()     -- UTC timestamp of the meal
);

-- 3. Weight Tracking
CREATE TABLE IF NOT EXISTS weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,        -- Clerk User ID
    weight FLOAT NOT NULL,                -- Weight value
    date DATE NOT NULL                    -- Local calendar date of weigh-in
);
```

### Meal JSONB Schema
```json
{
  "foods": [
    {
      "name": "Grilled Chicken Salad",
      "portion": "1 bowl (approx 300g)",
      "calories": 380,
      "protein": 38,
      "carbs": 12,
      "fat": 18,
      "fiber": 4
    }
  ],
  "totalCalories": 380,
  "totalProtein": 38,
  "totalCarbs": 12,
  "totalFat": 18,
  "totalFiber": 4,
  "healthScore": 9,
  "weightLossTip": "Light dressing kept calories minimal.",
  "healthierAlternative": "Replace croutons with roasted pumpkin seeds."
}
```

---

## 4. API Routes & Server Actions Catalog

### A. Route Handlers (`src/app/api/`)

| Route | Method | Inputs | Description |
|---|---|---|---|
| `/api/analyze` | `POST` | `{ images: string[], mimeType: string, description?: string }` | Sends base64 image array to Gemini vision model with structured prompt, parses JSON output, handles 503/429 retryable errors. |
| `/api/analyze-text` | `POST` | `{ text: string }` | Analyzes manual natural-language meal descriptions (e.g. "2 boiled eggs with 1 slice toast"). |
| `/api/get-insight` | `POST` | `{ weeklyStats: object[], profile: object }` | Generates personalized weekly coaching summary considering dietary preferences (e.g., Indian vegetarian protein sources). |

### B. Server Actions (`src/app/actions.js`)

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `initDb()` | None | `{ success: boolean, error?: string }` | Creates database tables if they do not exist. |
| `getProfile()` | None | `Profile` object or `null` | Fetches authenticated user's profile goals. |
| `saveProfile(profile)` | `profile` | `{ success: boolean }` | Upserts profile data using Clerk `userId`. |
| `getAllMeals()` | None | `Meal[]` | Fetches all meals for user ordered by timestamp DESC. |
| `saveMeal(meal, clientTimestamp)` | `meal: object, clientTimestamp?: string` | `{ success: boolean, id: string, timestamp: string }` | Inserts meal JSONB and associates with user. |
| `deleteMeal(id)` | `id: string` | `{ success: boolean }` | Deletes a meal by UUID. |
| `getWeightHistory()` | None | `WeightEntry[]` | Fetches weight progression entries. |
| `saveWeight(entry)` | `{ weight: number, date?: string, timezoneOffset?: number }` | `{ success: boolean, id: string }` | Saves weight entry with timezone correction. |
| `deleteWeight(id)` | `id: string` | `{ success: boolean }` | Deletes a weight entry. |
| `getDashboardStats(offset)`| `timezoneOffset: number` | `{ streak: number, dailyMacros: object, recentMeals: object[] }` | Computes today's macros and user logging streak. |
| `getWeeklyStats(offset)` | `timezoneOffset: number` | `DayStat[]` | Aggregates daily calories/macros over the last 7 calendar days. |

### C. Client Storage Utilities (`src/app/lib/storage.js`)

| Function | Storage Target | Description |
|---|---|---|
| `savePendingUpload(images, mimeType, description)` | IndexedDB (`pendingUploads`) | Queues photos locally when AI API is unavailable. |
| `getPendingUploads()` | IndexedDB (`pendingUploads`) | Retrieves all offline pending uploads for retry. |
| `removePendingUpload(id)` | IndexedDB (`pendingUploads`) | Deletes an upload once processed. |

---

## 5. Directory Structure & Key Files

```
c:\Users\Saransh\Projects\Health Monitor\
├── public/
│   ├── icons/                 # PWA icons (192x192, 512x512, apple-touch-icon)
│   └── manifest.json          # PWA web manifest specification
├── src/
│   ├── middleware.js          # Clerk route protection middleware
│   └── app/
│       ├── layout.js          # Root layout, ClerkProvider, viewport, meta tags
│       ├── globals.css        # Tailwind v4 import, tokens, animations, glassmorphism
│       ├── actions.js         # PostgreSQL server actions & database queries
│       ├── page.js            # Dashboard (CalorieRing, MacroBar, Streak, Quick Scan CTA)
│       ├── scan/page.js       # Food Scanner (Capture, multi-photo preview, text entry, offline queue)
│       ├── log/page.js        # Meal History log, 7-day WeeklyChart, AI Insight Coach
│       ├── profile/page.js    # Profile settings, daily goals, BMR/TDEE, weight tracker
│       ├── api/
│       │   ├── analyze/       # Multimodal vision nutrition endpoint
│       │   ├── analyze-text/  # Text meal description endpoint
│       │   └── get-insight/   # Weekly nutrition coaching endpoint
│       ├── components/
│       │   ├── BottomNav.js   # Mobile navigation bar with safe-area padding
│       │   ├── DesktopSidebar.js # Desktop navigation sidebar
│       │   ├── CalorieRing.js # SVG circular progress ring
│       │   ├── MacroBar.js    # Linear macro progress bar (Protein, Carbs, Fat, Fiber)
│       │   ├── NutritionCard.js # Card displaying meal breakdown, health score & tips
│       │   ├── WeeklyChart.js # 7-day bar chart of calorie intake
│       │   └── AIInsight.js   # Generative weekly coach widget
│       └── lib/
│           └── storage.js     # IndexedDB client queue helper
```

---

## 6. Security, Authentication & Environment Variables

### Authentication
Handled via `@clerk/nextjs`.
* Unauthenticated requests to protected routes are redirected by `src/middleware.js`.
* Public routes: `/sign-in(.*)`, `/sign-up(.*)`, `/api/analyze(.*)`, `/manifest(.*)`.
* Server actions authenticate users securely using `const { userId } = await auth();`.

### Required Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
GOOGLE_API_KEY=AIzaSy...
```

---

## 7. Apple Design System & Theme Engine (Light & Dark Mode)

NutriSnap implements Apple's Human Interface Guidelines (HIG) with seamless Light and Dark mode support:

### Theme Architecture
* **`ThemeProvider.js`**: Context provider managing theme state (`'system' | 'light' | 'dark'`). It persists choices to `localStorage('nutrisnap-theme')` and actively listens to OS `window.matchMedia('(prefers-color-scheme: dark)')` events.
* **Anti-Flicker Script**: An inline script in `src/app/layout.js` `<head>` executes prior to React hydration to prevent flash of unstyled theme on page load.
* **`ThemeToggle.js`**: Haptic-enabled toggle button located in the dashboard, header, and sidebar allowing one-tap switching between modes.

### Theme Tokens
| Token | Light Mode (`:root`) | Dark Mode (`.dark`) |
|---|---|---|
| Background Canvas | `#f2f2f7` (iOS Grouped Bg) | `#000000` (True OLED Black) |
| Elevated Cards | `rgba(255, 255, 255, 0.85)` + 25px blur | `rgba(28, 28, 30, 0.65)` + 28px blur |
| Card Border | `1px solid rgba(0, 0, 0, 0.08)` | `1px solid rgba(255, 255, 255, 0.08)` |
| Primary Text | `#1c1c1e` (Apple Deep Gray) | `#ffffff` (Pure White) |
| Secondary Text | `#636366` | `#8e8e93` |
| Floating Nav Bar | `rgba(255, 255, 255, 0.88)` + shadow | `rgba(28, 28, 30, 0.85)` + shadow |
| Activity Move Ring | `#fa114f` (Move Coral) | `#fa114f` (Move Coral) |
| Activity Exercise Ring | `#30d158` (Exercise Green) | `#99e836` (Electric Lime) |
| Activity Stand Ring | `#007aff` (Apple Blue) | `#00d2ff` (Cyan Glow) |

