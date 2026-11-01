
from fastapi import FastAPI

app = FastAPI(
    title="CodeStorm Climate Intelligence API",
    description="Weather, air quality, climate risk, and forecasting API",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "project": "CodeStorm Climate Intelligence",
    }
