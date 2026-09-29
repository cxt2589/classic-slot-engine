"""
FastAPI Server for Classic 5x3 Retro Slot.
Serves REST API and Interactive Web Client.
"""
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import os

from engine.symbols import Symbol, PAYTABLE, SCATTER_PAYOUT, FREE_SPINS_AWARDED, SYMBOL_META, FREE_SPINS_WIN_MULTIPLIER
from engine.paylines import PAYLINES, PAYLINE_COLORS
from engine.game import SlotGame, PlayerSession
from engine.rng import SlotRNG
from simulate import run_simulation

app = FastAPI(
    title="Retro 777 Deluxe - Slot Engine API",
    description="Backend API and Math Engine for Classic 5x3 Retro Slot Machine",
    version="1.0.0"
)

# Shared in-memory session (single player demo session, easily extendable to Redis/DB)
game_engine = SlotGame()
default_session = PlayerSession(balance=10000.0)


class SpinRequest(BaseModel):
    bet_per_line: float = Field(default=1.0, ge=0.1, le=100.0, description="Bet per line (credits)")
    num_lines: int = Field(default=20, ge=1, le=20, description="Number of active paylines (1-20)")


class ResetRequest(BaseModel):
    initial_balance: float = Field(default=10000.0, ge=100.0, description="Initial credit balance")


class SimRequest(BaseModel):
    spins: int = Field(default=10000, ge=100, le=100000, description="Number of spins to simulate")
    bet_per_line: float = Field(default=1.0, ge=0.1, le=100.0)
    num_lines: int = Field(default=20, ge=1, le=20)


@app.get("/api/session")
def get_session():
    """Get current player session state."""
    return {
        "status": "success",
        "data": default_session.to_dict(),
        "recent_history": default_session.history[:10]
    }


@app.post("/api/spin")
def spin_reels(req: SpinRequest):
    """Execute a spin on the reels."""
    try:
        result = game_engine.spin(
            session=default_session,
            bet_per_line=req.bet_per_line,
            num_lines=req.num_lines
        )
        return {
            "status": "success",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/reset")
def reset_session(req: ResetRequest):
    """Reset player balance and state."""
    global default_session
    default_session = PlayerSession(balance=req.initial_balance)
    return {
        "status": "success",
        "message": f"Session reset with balance {req.initial_balance:.2f}",
        "data": default_session.to_dict()
    }


@app.get("/api/paytable")
def get_paytable_info():
    """Retrieve full game paytable, symbols metadata, and paylines."""
    # Convert Enum keys to strings
    paytable_serialized = {
        sym.value: {str(cnt): mult for cnt, mult in pays.items()}
        for sym, pays in PAYTABLE.items()
    }
    symbols_meta_serialized = {
        sym.value: meta for sym, meta in SYMBOL_META.items()
    }

    return {
        "status": "success",
        "data": {
            "paytable": paytable_serialized,
            "scatter_payout": {str(cnt): mult for cnt, mult in SCATTER_PAYOUT.items()},
            "free_spins_awarded": {str(cnt): spins for cnt, spins in FREE_SPINS_AWARDED.items()},
            "free_spins_win_multiplier": FREE_SPINS_WIN_MULTIPLIER,
            "paylines": PAYLINES,
            "payline_colors": PAYLINE_COLORS,
            "symbols_meta": symbols_meta_serialized,
        }
    }


@app.post("/api/simulate")
def run_live_simulation(req: SimRequest):
    """Run a high-speed Monte Carlo simulation and return statistics."""
    report = run_simulation(
        num_spins=req.spins,
        bet_per_line=req.bet_per_line,
        num_lines=req.num_lines
    )
    return {
        "status": "success",
        "data": report
    }


# Mount static assets for the web UI
web_dir = os.path.join(os.path.dirname(__file__), "web")
if os.path.exists(web_dir):
    app.mount("/static", StaticFiles(directory=web_dir), name="static")


@app.get("/")
def serve_index():
    index_path = os.path.join(web_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Retro 777 Deluxe Slot Engine is running. Visit /docs for Swagger API."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
