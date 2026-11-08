# CodeStorm Climate Intelligence (ClimateScope)

A full-stack, enterprise-grade climate intelligence platform providing real-time weather analytics, air quality indexing, corridor risk analysis, historical climate retrospectives, and ML-assisted climate forecasting.

---

## Architecture Overview

- **Frontend (`/frontend`)**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Leaflet interactive geospatial maps, and Recharts analytics dashboards.
- **Backend (`/backend`)**: Python FastAPI application exposing modular endpoints for weather, air quality, climate risk, and historical forecasts.
- **Unified Serverless Bridge (`/api/index.py`)**: ASGI entrypoint allowing the FastAPI application to run natively as a Vercel Python Serverless Function alongside Next.js.

---

## Live Deployment on Vercel

The application is pre-configured for **unified deployment on Vercel** where both the Next.js frontend and FastAPI backend run under the same domain:

1. Import `mobin-25/CodeStorm-Climate-Intelligence` on [Vercel](https://vercel.com/new).
2. Leave **Root Directory** as `./` (default repository root).
3. Vercel automatically runs the build command and configures Python serverless routing from `vercel.json`.
4. (Optional) In Vercel Environment Variables, add:
   - `NEXT_PUBLIC_USE_REAL_BACKEND=true`
5. Click **Deploy**.

For detailed architecture, routing tables, and timeout configurations, see [DEPLOYMENT.md](./DEPLOYMENT.md).

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
