# CodeStorm Climate Intelligence (ClimateScope)

A full-stack, enterprise-grade climate intelligence platform providing real-time weather analytics, air quality indexing, corridor risk analysis, historical climate retrospectives, and ML-assisted climate forecasting.

---

## Architecture Overview

- **Frontend (`/frontend`)**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Leaflet interactive geospatial maps, and Recharts analytics dashboards.
- **Backend (`/backend`)**: Python FastAPI application exposing modular endpoints for weather, air quality, climate risk, and historical forecasts.
- **Deployment**: Deployed as two linked Vercel projects from this monorepo:
  - **Project 1 (Frontend)**: Root Directory `frontend/`, connected via Next.js server-side rewrites.
  - **Project 2 (Backend)**: Root Directory `backend/`, running on Vercel's Python Serverless runtime.

---

## Live Deployment on Vercel

The application is deployed as **Two Separate Vercel Projects** from the same GitHub repository:

1. **Deploy Backend First**: Import repository, set Root Directory to `backend/`.
2. **Deploy Frontend Second**: Import repository, set Root Directory to `frontend/`. Add environment variable `BACKEND_URL` pointing to the deployed backend URL.

For complete step-by-step instructions and environment variable references, see [DEPLOYMENT.md](./DEPLOYMENT.md).

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
