import uuid
from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

# We define a custom UUID column that gracefully falls back to String for SQLite compatibility
class GUID(String):
    pass

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to cleanly fetch a user's entire history (User.backtests)
    backtests = relationship("BacktestHistory", back_populates="owner")
