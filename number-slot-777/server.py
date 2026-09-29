"""
FastAPI Server for 5x3 Number Slot Game.
"""
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import os

from engine.rules import BetType, BET_PAYOUTS, SINGLE_NUMBER_PAYOUTS, BASE_HAND_PAYOUTS, NUMBER_COLORS
from engine.game import PlayerSession, NumberSlotGame
from simulate import run_simulation

app = FastAPI(
    title="Lucky Numbers 777 - Classic Number Slot Engine API",
    description="Backend API and Math Engine for 5x3 Single Center Line Number Slot",
    version="1.0.0"
)

game_engine = NumberSlotGame()
default_session = PlayerSession(balance=10000.0)


class SpinRequest(BaseModel):
    bets: Dict[str, float] = Field(
        default={"BASE_SPIN": 10.0},
        description="Dictionary of user bets, e.g. {'TAI': 20.0, 'THUNG': 10.0, 'SO_7': 10.0, 'BASE_SPIN': 10.0}"
    )


class ResetRequest(BaseModel):
    initial_balance: float = Field(default=10000.0, ge=100.0)


class SimRequest(BaseModel):
    spins: int = Field(default=10000, ge=100, le=100000)


@app.get("/api/session")
def get_session():
    """Retrieve player session info."""
    return {
        "status": "success",
        "data": default_session.to_dict(),
        "recent_history": default_session.history[:100],
    }


@app.post("/api/spin")
def spin_reels(req: SpinRequest):
    """Execute spin and evaluate center line."""
    try:
        result = game_engine.spin(session=default_session, bets=req.bets)
        return {
            "status": "success",
            "data": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/reset")
def reset_session(req: ResetRequest):
    """Reset player balance."""
    global default_session
    default_session = PlayerSession(balance=req.initial_balance)
    return {
        "status": "success",
        "message": f"Số dư đã nạp lại {req.initial_balance:,.2f} credits",
        "data": default_session.to_dict(),
    }


@app.get("/api/rules")
def get_rules():
    """Return all betting types, multipliers, and number styling."""
    return {
        "status": "success",
        "data": {
            "bet_payouts": {bt.value: mult for bt, mult in BET_PAYOUTS.items()},
            "single_number_payouts": SINGLE_NUMBER_PAYOUTS,
            "base_hand_payouts": BASE_HAND_PAYOUTS,
            "number_colors": NUMBER_COLORS,
        },
    }


@app.post("/api/simulate")
def run_live_simulation(req: SimRequest):
    """Run Monte Carlo simulation."""
    report = run_simulation(num_spins=req.spins)
    return {
        "status": "success",
        "data": report,
    }


# Static web serving
web_dir = os.path.join(os.path.dirname(__file__), "web")
if os.path.exists(web_dir):
    app.mount("/static", StaticFiles(directory=web_dir), name="static")


@app.get("/")
def serve_index():
    index_path = os.path.join(web_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Lucky Numbers 777 Slot Engine API is live. Visit /docs."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8001, reload=True)
