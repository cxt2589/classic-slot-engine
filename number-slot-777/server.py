"""
FastAPI Server for Lucky Numbers 777 (5x3 Number Slot Game).
Compliant with GLI-19 standards and OpenAPI 3.0.2 specification.
"""
from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import os

from engine.rules import BetType, BET_PAYOUTS, SINGLE_NUMBER_PAYOUTS, BASE_HAND_PAYOUTS, NUMBER_COLORS
from engine.game import PlayerSession, NumberSlotGame
from simulate import run_simulation

app = FastAPI(
    title="Lucky Numbers 777 - Classic Number Slot Engine API",
    description=(
        "Backend API and GLI-19 Math Engine for 5x3 Single Center Payline Number Slot. "
        "Supports Base Game Spin (BASE_SPIN), Side Bets (Tài/Xỉu, Chẵn/Lẻ, Thùng, Sảnh, "
        "Poker Combinations, Single Numbers 1..9), Real-time Baccarat Roadmaps telemetry "
        "(Bead Plate & Multi-tier Big Road), and Monte Carlo Verification."
    ),
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

game_engine = NumberSlotGame()
default_session = PlayerSession(balance=10000.0)


# ==========================================
# PYDANTIC MODELS (OpenAPI Schema Models)
# ==========================================

class SpinRequest(BaseModel):
    bets: Dict[str, float] = Field(
        default={"BASE_SPIN": 10.0},
        description=(
            "Dictionary mapping bet keys to wager amounts in credits. "
            "Supported keys include: "
            "'BASE_SPIN' (Base game spin paying on center line poker hands), "
            "'TAI' (Sum > 25, x2.05), 'XIU' (Sum < 25, x2.05), 'HOA_25' (Sum == 25, x14.1), "
            "'CHAN' (Even sum, x1.92), 'LE' (Odd sum, x1.92), "
            "'THUNG' (5 same parity, x13.6), 'THUNG_CHAN' (5 evens, x55.0), 'THUNG_LE' (5 odds, x18.0), "
            "'SANH' (5 consecutive, x94.0), 'SANH_CHUAN' (1-2-3-4-5 in order, x5000.0), "
            "'NGU_QUY' (5 of a kind, x5000.0), 'TU_QUY' (4 of a kind, x156.0), "
            "'CU_LU' (Full house 3+2, x78.0), 'SAM_CO' (3 of a kind, x11.2), "
            "'HAI_DOI' (Two pair, x7.45), 'MOT_DOI' (One pair, x1.86), "
            "'SO_1' .. 'SO_9' (Single number match, x1.7 up to x100.0)."
        ),
        example={
            "BASE_SPIN": 10.0,
            "TAI": 50.0,
            "THUNG": 20.0,
            "SO_7": 10.0
        }
    )


class WinningItem(BaseModel):
    bet_type: str = Field(..., description="Key of the bet that won, e.g. BASE_SPIN, TAI, SO_7")
    wager: float = Field(..., description="Wager amount placed on this bet key")
    multiplier: float = Field(..., description="Calculated payout multiplier")
    win_amount: float = Field(..., description="Gross payout won for this specific bet")
    reason_vi: str = Field(..., description="Vietnamese explanatory message for winning condition")


class HandAnalysis(BaseModel):
    numbers: List[int] = Field(..., description="The 5 numbers along the center payline (Row 1)")
    sum: int = Field(..., description="Sum of the 5 center numbers (range 5 to 45)")
    is_tai: bool = Field(..., description="True if sum > 25")
    is_xiu: bool = Field(..., description="True if sum < 25")
    is_hoa_25: bool = Field(..., description="True if sum == 25 (Push/Draw)")
    is_chan: bool = Field(..., description="True if sum is even")
    is_le: bool = Field(..., description="True if sum is odd")
    is_thung: bool = Field(..., description="True if all 5 numbers share parity (all even or all odd)")
    is_thung_chan: bool = Field(..., description="True if all 5 numbers are even")
    is_thung_le: bool = Field(..., description="True if all 5 numbers are odd")
    is_sanh: bool = Field(..., description="True if 5 numbers form consecutive sequence in any order")
    is_sanh_chuan: bool = Field(..., description="True if numbers are exactly 1-2-3-4-5 in order")
    best_hand: str = Field(..., description="Identifier of highest poker hand, e.g. SAM_CO, CU_LU")
    hand_title_vi: str = Field(..., description="Vietnamese localized display title of poker hand")
    counts: Dict[str, int] = Field(..., description="Frequency map of each number on the center line")


class SpinPayout(BaseModel):
    total_bet: float = Field(..., description="Total credits wagered across all active bets")
    total_won: float = Field(..., description="Total gross credits won from all winning bets")
    net_profit: float = Field(..., description="Net balance change (total_won - total_bet)")
    winning_items: List[WinningItem] = Field(..., description="List of individual winning bets and payouts")


class HistoryRecord(BaseModel):
    spin: int = Field(..., description="Sequential spin number")
    center_row: List[int] = Field(..., description="Center line numbers [n1, n2, n3, n4, n5]")
    sum: int = Field(..., description="Sum of center numbers")
    is_tai: bool
    is_xiu: bool
    is_hoa_25: bool
    is_chan: bool
    is_le: bool
    is_thung: bool
    is_sanh: bool
    best_hand: str
    best_hand_key: str
    total_bet: float
    total_won: float
    net: float


class PlayerSessionModel(BaseModel):
    session_id: str = Field(..., description="Unique UUID for player session")
    balance: float = Field(..., description="Current available wallet balance in credits")
    total_wagered: float = Field(..., description="Lifetime credits wagered in current session")
    total_won: float = Field(..., description="Lifetime gross winnings in current session")
    total_spins: int = Field(..., description="Total spins executed in current session")
    rtp_actual: float = Field(..., description="Current session empirical RTP percentage")
    history: List[HistoryRecord] = Field(..., description="Recent spins telemetry for Baccarat roadmaps")


class SpinResultData(BaseModel):
    stops: List[int] = Field(..., description="CSPRNG stop positions for each of the 5 virtual reels")
    grid: List[List[int]] = Field(..., description="3x5 visible matrix. Row 1 is the ONLY center payline.")
    center_row: List[int] = Field(..., description="Numbers evaluated on Row 1")
    analysis: HandAnalysis = Field(..., description="Comprehensive mathematical analysis of center numbers")
    payout: SpinPayout = Field(..., description="Wager evaluation and payout breakdown")
    session: PlayerSessionModel = Field(..., description="Updated player session state")


class SpinResponse(BaseModel):
    status: str = Field(default="success")
    data: SpinResultData


class SessionResponse(BaseModel):
    status: str = Field(default="success")
    data: PlayerSessionModel
    recent_history: List[HistoryRecord]


class ResetRequest(BaseModel):
    initial_balance: float = Field(default=10000.0, ge=100.0, le=10000000.0, description="Starting wallet balance")


class SimRequest(BaseModel):
    spins: int = Field(default=10000, ge=100, le=50000, description="Number of Monte Carlo spins to simulate")


# ==========================================
# REST API ENDPOINTS
# ==========================================

@app.get(
    "/api/session",
    response_model=SessionResponse,
    tags=["Player & Session"],
    summary="Retrieve current player session and roadmap history"
)
def get_session():
    """
    Returns player wallet balance, cumulative statistics, and recent spin history
    used by client-side Bead Plate and Multi-tier Big Road visualizers.
    """
    return {
        "status": "success",
        "data": default_session.to_dict(),
        "recent_history": default_session.history[:100],
    }


@app.post(
    "/api/spin",
    response_model=SpinResponse,
    tags=["Gameplay"],
    summary="Execute spin and evaluate center payline (Row 1)"
)
def spin_reels(req: SpinRequest = Body(...)):
    """
    Performs a certified GLI-19 RNG spin across 5 virtual reel strips (54 stops each).
    Evaluates Row 1 (Center Payline) against active bets:
    - Base Spin (`BASE_SPIN`): pays based on center poker hands (Pair, Two Pair, Three of Kind, Straight, Flush, Full House, Quads, Five of Kind).
    - Side Bets: Tài/Xỉu (Sum > / < 25), Chẵn/Lẻ, Thùng, Sảnh, Số Đơn 1..9, Poker dự đoán.
    Updates player session balance and records telemetry for roadmaps.
    """
    try:
        result = game_engine.spin(session=default_session, bets=req.bets)
        return {
            "status": "success",
            "data": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post(
    "/api/reset",
    tags=["Player & Session"],
    summary="Reset player balance to initial amount"
)
def reset_session(req: ResetRequest = Body(...)):
    """
    Resets the player session wallet back to the specified amount (default: 10,000 credits)
    while preserving lifetime total_wagered, total_won, and VIP status.
    """
    global default_session
    prev_wagered = default_session.total_wagered if default_session else 0.0
    prev_won = default_session.total_won if default_session else 0.0
    prev_spins = default_session.total_spins if default_session else 0
    prev_history = default_session.history if default_session else []

    default_session = PlayerSession(
        balance=req.initial_balance,
        total_wagered=prev_wagered,
        total_won=prev_won,
        total_spins=prev_spins,
        history=prev_history
    )
    return {
        "status": "success",
        "message": f"Số dư đã nạp lại {req.initial_balance:,.2f} credits (Bảo lưu nguyên vẹn cấp VIP & Tổng cược)",
        "data": default_session.to_dict(),
    }


@app.get(
    "/api/rules",
    tags=["Game Rules"],
    summary="Get payout table, multipliers, and number styling"
)
def get_rules():
    """
    Returns full game configuration including Side Bet multipliers, Single Number match tiers,
    Base Game Poker hand multipliers, and number styling colors.
    """
    return {
        "status": "success",
        "data": {
            "bet_payouts": {bt.value: mult for bt, mult in BET_PAYOUTS.items()},
            "single_number_payouts": SINGLE_NUMBER_PAYOUTS,
            "base_hand_payouts": BASE_HAND_PAYOUTS,
            "number_colors": NUMBER_COLORS,
        },
    }


@app.post(
    "/api/simulate",
    tags=["Certification & Math"],
    summary="Execute high-speed Monte Carlo simulation"
)
def run_live_simulation(req: SimRequest = Body(...)):
    """
    Simulates between 100 and 50,000 random spins using CSPRNG virtual reel stops.
    Measures empirical RTP, hit frequency, payout distributions, and execution speed.
    """
    report = run_simulation(num_spins=req.spins)
    return {
        "status": "success",
        "data": report,
    }


# ==========================================
# STATIC WEB SERVING
# ==========================================
web_dir = os.path.join(os.path.dirname(__file__), "web")
if os.path.exists(web_dir):
    app.mount("/static", StaticFiles(directory=web_dir), name="static")


@app.get("/", include_in_schema=False)
def serve_index():
    index_path = os.path.join(web_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Lucky Numbers 777 Slot Engine API is live. Visit /docs for OpenAPI documentation."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8001, reload=True)
