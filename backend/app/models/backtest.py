import uuid
from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class BacktestHistory(Base):
    __tablename__ = "backtest_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Store exact parameters
    strategy_id = Column(String, nullable=False, index=True)
    universe = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    initial_capital = Column(Float, nullable=False)
    
    # Store resultant metrics
    final_capital = Column(Float, nullable=False)
    sharpe_ratio = Column(Float)
    max_drawdown = Column(Float)
    
    # Optional raw equity JSON string for rendering charts without recalculating
    chart_data = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Clean relationship referencing the User table
    owner = relationship("User", back_populates="backtests")
