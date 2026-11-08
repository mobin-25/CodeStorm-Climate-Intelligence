# Vercel Services Deployment Guide: ClimateScope

This repository is configured for **Vercel Services**, Vercel's official multi-framework monorepo architecture:
- **`frontend/`**: Next.js 16 (React 19, Tailwind CSS v4, Leaflet geospatial mapping, Recharts dashboards).
- **`backend/`**: FastAPI Python application with modular routers for weather, air quality, climate risk, forecast, and historical climate analytics.

---

## 1. How Vercel Services Works in this Monorepo

The root [`vercel.json`](./vercel.json) defines both services and their routing rules:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "frontend": {
      "root": "frontend/",
      "framework": "nextjs"
    },
    "backend": {
      "root": "backend/",
      "framework": "fastapi",
      "entrypoint": "app.main:app"
    }
  },
  "rewrites": [
    {
      "source": "/api/geocode",
      "destination": { "service": "frontend" }
    },
    {
      "source": "/health",
      "destination": { "service": "backend" }
    },
    {
      "source": "/api/weather/:path*",
      "destination": { "service": "backend" }
    },
    {
      "source": "/api/air-quality/:path*",
      "destination": { "service": "backend" }
    },
    {
      "source": "/api/climate-risk/:path*",
      "destination": { "service": "backend" }
    },
    {
      "source": "/api/historical/:path*",
      "destination": { "service": "backend" }
    },
    {
      "source": "/api/forecast/:path*",
      "destination": { "service": "backend" }
    },
    {
      "source": "/(.*)",
      "destination": { "service": "frontend" }
    }
  ]
}
```

### Why this is the best supported architecture:
1. **No Root Shims**: Eliminates artificial files like `api/index.py`, root `package.json`, or duplicate root `requirements.txt`.
2. **Native Framework Support**: Vercel handles `frontend/` as a native Next.js project and `backend/` as a native FastAPI ASGI application.
3. **Sequential Evaluation**: `/api/geocode` is evaluated first and forwarded directly to Next.js (`frontend/app/api/geocode/route.ts`). All domain API routes are forwarded to FastAPI, and all web pages go to Next.js.
4. **Unified Deployment**: Both services deploy atomically in one deployment, share custom domains, and communicate with zero cross-origin (CORS) overhead.

---

## 2. Vercel Dashboard Settings

When importing the project into Vercel:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Project Name** | `codespace-climatescope` *(or your preference)* | Unique project identifier |
| **Root Directory** | `./` *(Leave as repository root)* | Vercel Services will automatically navigate to `frontend/` and `backend/` as configured in `vercel.json` |
| **Framework Preset** | *Auto-detected from `vercel.json`* | No manual overrides needed |

---

## 3. Environment Variables Configuration

Set these under **Project Settings ➔ Environment Variables** in the Vercel Dashboard:

| Variable | Environment | Recommended Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_USE_REAL_BACKEND` | Production, Preview | `true` | Tells the frontend to query the live FastAPI backend instead of fallback sample corridors |
| `ARCHIVE_REQUEST_TIMEOUT_SECONDS` | Production, Preview | `10.0` | Guards against upstream Open-Meteo archive latency on Vercel 10s–15s function execution limits |
| `HISTORICAL_REQUEST_TIMEOUT_SECONDS` | Production, Preview | `10.0` | Guards against historical provider timeouts |
| `CPCB_API_KEY` | Production, Preview | *(Optional)* | Secret key for Central Pollution Control Board / CAAQMS. Kept strictly server-side (no `NEXT_PUBLIC_` prefix) |

---

## 4. Local Development

### Run Backend (FastAPI):
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Run Frontend (Next.js):
```bash
cd frontend
npm install
npm run dev
```
