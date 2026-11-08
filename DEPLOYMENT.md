# Deployment Guide: CodeStorm Climate Intelligence

This repository contains a full-stack climate intelligence platform consisting of:
- **Frontend**: Next.js 16 (React 19, Tailwind CSS v4, Lucide, Leaflet maps, Recharts).
- **Backend**: FastAPI Python backend (weather, air quality, climate risk, forecast, and historical climate analytics).

---

## 1. Deploying Frontend to Vercel (Recommended)

Since the frontend is built with Next.js, Vercel provides native zero-configuration hosting with continuous deployment from GitHub.

### Step-by-Step Instructions:

1. **Log in to Vercel**:
   Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.

2. **Add New Project**:
   - Click **"Add New..."** -> **"Project"**.
   - Select your repository: `mobin-25/CodeStorm-Climate-Intelligence`.

3. **Configure Project Settings**:
   - **Framework Preset**: `Next.js` (auto-detected).
   - **Root Directory**: Click **Edit** and set it to **`frontend`** (important: the frontend code resides in the `frontend` subfolder).
   - **Build Command**: `next build` (default).
   - **Output Directory**: `.next` (default).

4. **Set Environment Variables (Optional)**:
   Under **Environment Variables**, configure:
   - `NEXT_PUBLIC_USE_REAL_BACKEND`: `false` (to run the frontend in self-contained demo/mock mode with built-in corridor data), or `true` once your FastAPI backend is deployed.
   - `NEXT_PUBLIC_API_URL`: Your deployed FastAPI backend URL (e.g. `https://your-backend.onrender.com`).

5. **Deploy**:
   - Click **"Deploy"**.
   - Vercel will install dependencies, compile the app, and generate your live URL (e.g., `https://codestorm-climate-intelligence.vercel.app`).

---

## 2. Deploying Backend (FastAPI)

The backend is built with FastAPI and runs on Python 3.10+. Free and low-cost deployment platforms include **Render**, **Railway**, and **Fly.io**.

### Deploying to Render (Recommended Free/Easy):
1. Go to [render.com](https://render.com) and create an account.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `mobin-25/CodeStorm-Climate-Intelligence`.
4. Configure service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Create Web Service**.
6. Once deployed, copy your Render URL (e.g. `https://climate-api.onrender.com`).
7. Update `NEXT_PUBLIC_API_URL` in your Vercel project's Environment Variables and trigger a redeploy.
