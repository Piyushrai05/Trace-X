from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import db
from app.routers import (
    health, recalls, investigations, overview, batches,
    kitchens, suppliers, complaints, carto, copilot,
    tasks, demo, stream, ask
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect(settings)
    yield
    await db.close()

app = FastAPI(title='TraceX API', version='1.0.0', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, 'http://localhost:5173', '*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(health.router, prefix='/api')
app.include_router(recalls.router, prefix='/api')
app.include_router(tasks.router, prefix='/api')
app.include_router(investigations.router, prefix='/api')
app.include_router(overview.router, prefix='/api')
app.include_router(batches.router, prefix='/api')
app.include_router(kitchens.router, prefix='/api')
app.include_router(suppliers.router, prefix='/api')
app.include_router(complaints.router, prefix='/api')
app.include_router(carto.router, prefix='/api')
app.include_router(copilot.router, prefix='/api')
app.include_router(demo.router, prefix='/api')
app.include_router(stream.router, prefix='/api')
app.include_router(ask.router, prefix='/api')

