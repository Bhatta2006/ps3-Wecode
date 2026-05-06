from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.backtest import router as backtest_router
from app.api.auth import router as auth_router
from app.db.database import engine, Base
# Import models so SQLAlchemy knows about them when creating tables
from app.models import User, BacktestHistory  # noqa: F401

app = FastAPI(title="TradeLab Backend")

# Create all tables automatically on first startup (no manual migration needed)
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production to specific domains like ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(backtest_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {"status": "Backend is running"}
