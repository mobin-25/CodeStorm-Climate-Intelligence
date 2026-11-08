# CodeStorm Climate Intelligence (ClimateScope)

A full-stack, enterprise-grade climate intelligence platform providing real-time weather analytics, air quality indexing, corridor risk analysis, historical climate retrospectives, and ML-assisted climate forecasting.

---

## Architecture Overview

- **Frontend (`/frontend`)**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Leaflet interactive geospatial maps, and Recharts analytics dashboards.
- **Backend (`/backend`)**: Python FastAPI application exposing modular endpoints for weather, air quality, climate risk, and historical forecasts with CORS support for production environments.

---

## Live Deployment on Vercel

The frontend is ready for immediate deployment on Vercel:

1. Import `mobin-25/CodeStorm-Climate-Intelligence` on [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `frontend`.
3. Set environment variable:
   - `NEXT_PUBLIC_USE_REAL_BACKEND=false` (for standalone preview with built-in corridor data) or `true` when pointing to a deployed backend.
4. Click **Deploy**.

For complete instructions on deploying both the Next.js frontend to Vercel and the FastAPI backend to Render / Railway, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Local Development Setup

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.
