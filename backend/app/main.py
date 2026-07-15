import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.schemas import HealthResponse
from app.routers.dashboard import router as dashboard_router
from app.routers.handover import router as handover_router
from app.routers.opsgenie import router as opsgenie_router

logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.exception("Unhandled request error")
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
    duration_ms = round((time.perf_counter() - started) * 1000, 2)
    logger.info("%s %s completed in %sms", request.method, request.url.path, duration_ms)
    return response


app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(handover_router, prefix="/api/handover", tags=["Shift Handover"])
app.include_router(opsgenie_router, prefix="/api/opsgenie", tags=["Opsgenie"])


@app.get("/", response_model=HealthResponse)
def root() -> HealthResponse:
    return HealthResponse(
        application=settings.app_name,
        status="healthy",
        warnings=settings.validate_runtime(),
    )
