from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.classify import router as classify_router
from .middleware.rate_limit import RateLimitMiddleware


app = FastAPI(title="HS Classification Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware)

app.include_router(classify_router)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "hs-classifier"}
