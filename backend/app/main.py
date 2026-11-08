
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.air_quality import router as air_quality_router
from app.climate_risk import router as climate_risk_router
from app.forecast import router as forecast_router
from app.historical import router as historical_router
from app.weather import router as weather_router

app = FastAPI(
    title="CodeStorm Climate Intelligence API",
    description="Weather, air quality, climate risk, and forecasting API",
    version="0.1.0",
)

cors_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]
env_origins = os.getenv("CORS_ORIGINS")
if env_origins:
    cors_origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(weather_router)
app.include_router(air_quality_router)
app.include_router(climate_risk_router)
app.include_router(historical_router)
app.include_router(forecast_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "project": "CodeStorm Climate Intelligence",
    }
