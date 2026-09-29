"""
Game Loop and Session Manager for 5x3 Number Slot.
"""
from typing import Dict, Any, List, Optional
import uuid
from engine.reels import get_random_stops, generate_grid_from_stops
from engine.evaluator import CenterLineAnalysis, evaluate_bets


def generate_sample_spin(spin_num: int) -> Dict[str, Any]:
    stops = get_random_stops(use_crypto=True)
    grid = generate_grid_from_stops(stops)
    center_row = grid[1]
    analysis = CenterLineAnalysis(center_row)
    return {
        "spin": spin_num,
        "center_row": center_row,
        "sum": analysis.sum_val,
        "is_tai": analysis.is_tai,
        "is_xiu": analysis.is_xiu,
        "is_hoa_25": analysis.is_hoa_25,
        "is_chan": analysis.is_chan,
        "is_le": analysis.is_le,
        "is_thung": analysis.is_thung,
        "is_sanh": analysis.is_sanh,
        "best_hand": analysis.hand_title_vi,
        "best_hand_key": analysis.best_hand,
        "total_bet": 0.0,
        "total_won": 0.0,
        "net": 0.0,
    }


class PlayerSession:
    def __init__(self, balance: float = 10000.0, session_id: Optional[str] = None, seed_history: bool = True):
        self.session_id = session_id or str(uuid.uuid4())
        self.balance = balance
        self.initial_balance = balance
        self.total_wagered = 0.0
        self.total_won = 0.0
        self.total_spins = 0
        self.history: List[Dict[str, Any]] = []
        if seed_history:
            for i in range(35, 0, -1):
                self.history.append(generate_sample_spin(100 - i))

    def to_dict(self) -> Dict[str, Any]:
        rtp = (self.total_won / self.total_wagered * 100) if self.total_wagered > 0 else 0.0
        return {
            "session_id": self.session_id,
            "balance": round(self.balance, 2),
            "total_wagered": round(self.total_wagered, 2),
            "total_won": round(self.total_won, 2),
            "total_spins": self.total_spins,
            "rtp_actual": round(rtp, 2),
            "history": self.history[:100],
        }


class NumberSlotGame:
    def spin(self, session: PlayerSession, bets: Dict[str, float]) -> Dict[str, Any]:
        """
        Execute a spin with a dictionary of user bets.
        Example bets: {"TAI": 20.0, "THUNG": 10.0, "SO_7": 10.0, "BASE_SPIN": 10.0}
        """
        # Filter valid bets
        clean_bets = {k: float(v) for k, v in bets.items() if float(v) > 0}
        total_bet = sum(clean_bets.values())

        if total_bet <= 0:
            raise ValueError("Vui lòng đặt cược ít nhất 1 cửa (Tài, Xỉu, Thùng, Sảnh, Số 1..9, hoặc Base Spin)!")

        if session.balance < total_bet:
            raise ValueError(f"Số dư ({session.balance:.2f}) không đủ cho tổng cược ({total_bet:.2f})!")

        # Deduct bet
        session.balance -= total_bet
        session.total_wagered += total_bet
        session.total_spins += 1

        # 1. Roll 5 reels
        stops = get_random_stops(use_crypto=True)
        grid = generate_grid_from_stops(stops)

        # 2. Extract Center Row (Row 1 - Middle Row)
        center_row = grid[1]

        # 3. Analyze Center Numbers
        analysis = CenterLineAnalysis(center_row)

        # 4. Evaluate Bets
        eval_result = evaluate_bets(analysis, clean_bets)

        # 5. Apply Win
        total_won = eval_result["total_won"]
        session.balance += total_won
        session.total_won += total_won

        # Record history
        hist_entry = {
            "spin": session.total_spins,
            "center_row": center_row,
            "sum": analysis.sum_val,
            "is_tai": analysis.is_tai,
            "is_xiu": analysis.is_xiu,
            "is_hoa_25": analysis.is_hoa_25,
            "is_chan": analysis.is_chan,
            "is_le": analysis.is_le,
            "is_thung": analysis.is_thung,
            "is_sanh": analysis.is_sanh,
            "best_hand": analysis.hand_title_vi,
            "best_hand_key": analysis.best_hand,
            "total_bet": total_bet,
            "total_won": total_won,
            "net": eval_result["net_profit"],
        }
        session.history.insert(0, hist_entry)
        if len(session.history) > 100:
            session.history.pop()

        return {
            "session": session.to_dict(),
            "grid": grid,
            "center_row": center_row,
            "stops": stops,
            "analysis": analysis.to_dict(),
            "payout": eval_result,
        }
