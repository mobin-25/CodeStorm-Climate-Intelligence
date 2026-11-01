
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.air_quality import router as air_quality_router
from app.weather import router as weather_router

app = FastAPI(
    title="CodeStorm Climate Intelligence API",
    description="Weather, air quality, climate risk, and forecasting API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(weather_router)
app.include_router(air_quality_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "project": "CodeStorm Climate Intelligence",
    }
