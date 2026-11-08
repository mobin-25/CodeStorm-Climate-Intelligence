# Unified Deployment Guide: CodeStorm Climate Intelligence (ClimateScope)

This repository contains a full-stack climate intelligence platform configured for **unified deployment on Vercel**:
- **Frontend**: Next.js 16 (React 19, Tailwind CSS v4, Leaflet maps, Recharts).
- **Backend**: FastAPI Python application deployed as a Vercel Serverless Function via `api/index.py`.

---

## 1. Unified Deployment on Vercel (Frontend + FastAPI)

With the monorepo configuration in [`vercel.json`](./vercel.json), [`package.json`](./package.json), and [`api/index.py`](./api/index.py), both the Next.js frontend and FastAPI backend deploy together under a single domain.

### Step-by-Step Deployment:

1. **Push your code to GitHub**:
   Ensure all changes on branch `main` or your feature branch are pushed to GitHub.

2. **Open Vercel**:
   Go to [vercel.com/new](https://vercel.com/new) and select your GitHub repository: `mobin-25/CodeStorm-Climate-Intelligence`.

3. **Configure Project Settings**:
   - **Root Directory**: Leave as `./` (default repository root).
   - **Build Command**: Configured automatically by `vercel.json` (`cd frontend && npm install && npm run build`).
   - **Output Directory**: Configured automatically by `vercel.json` (`frontend/.next`).

4. **Environment Variables (Optional)**:
   Configure in Vercel Dashboard under **Project Settings ➔ Environment Variables**:
   - `NEXT_PUBLIC_USE_REAL_BACKEND`: `true` (enables live data across all routes).
   - `ARCHIVE_REQUEST_TIMEOUT_SECONDS`: `10.0` (recommended for Vercel Hobby 10s–15s execution timeout safety).
   - `HISTORICAL_REQUEST_TIMEOUT_SECONDS`: `10.0` (optional, guards against slow upstream open-meteo calls).
   - `CPCB_API_KEY`: *(Optional server-side key for CPCB / CAAQMS feeds. Never prefix with `NEXT_PUBLIC_`)*.

5. **Deploy**:
   - Click **Deploy**.
   - Vercel compiles the Next.js client and builds the Python serverless function.
   - Once completed, your app will be live at `https://<your-project>.vercel.app`.

---

## 2. API Routing Architecture on Vercel

All routes operate on the **same origin** (`https://<your-project>.vercel.app`):

| Route Path | Handler | Execution Type |
| :--- | :--- | :--- |
| `GET /` | Next.js Page | Static / Edge |
| `GET /compare` | Next.js Page | Static / Client |
| `GET /insights` | Next.js Page | Static / Client |
| `GET /reports` | Next.js Page | Static / Client |
| `GET /api/geocode` | Next.js Route Handler (`frontend/app/api/geocode/route.ts`) | Next.js Dynamic Node / Serverless |
| `GET /health` | FastAPI (`backend/app/main.py`) | Vercel Python Serverless (`api/index.py`) |
| `GET /api/weather/*` | FastAPI (`backend/app/weather.py`) | Vercel Python Serverless (`api/index.py`) |
| `GET /api/air-quality/*` | FastAPI (`backend/app/air_quality.py`) | Vercel Python Serverless (`api/index.py`) |
| `GET /api/climate-risk/*` | FastAPI (`backend/app/climate_risk.py`) | Vercel Python Serverless (`api/index.py`) |
| `GET /api/historical/*` | FastAPI (`backend/app/historical.py`) | Vercel Python Serverless (`api/index.py`) |
| `GET /api/forecast/*` | FastAPI (`backend/app/forecast.py`) | Vercel Python Serverless (`api/index.py`) |

---

## 3. Local Development

Run both servers locally:

### Terminal 1 — Backend (FastAPI):
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Terminal 2 — Frontend (Next.js):
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
