"""
Slot session management and game loop engine.
"""
from typing import Dict, Any, List, Optional
import uuid
from engine.symbols import Symbol
from engine.rng import SlotRNG
from engine.reels import get_random_stops, generate_grid_from_stops
from engine.evaluator import evaluate_grid, SpinResult


class PlayerSession:
    def __init__(self, balance: float = 10000.0, session_id: Optional[str] = None):
        self.session_id = session_id or str(uuid.uuid4())
        self.balance = balance
        self.initial_balance = balance
        self.total_wagered = 0.0
        self.total_won = 0.0
        self.total_spins = 0

        # Free Spins state
        self.in_free_spins = False
        self.free_spins_remaining = 0
        self.free_spins_total = 0
        self.free_spins_won_total = 0.0
        self.free_spins_bet_per_line = 1.0
        self.free_spins_num_lines = 20

        # History (last 20 spins)
        self.history: List[Dict[str, Any]] = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "balance": round(self.balance, 2),
            "total_wagered": round(self.total_wagered, 2),
            "total_won": round(self.total_won, 2),
            "total_spins": self.total_spins,
            "rtp_actual": round((self.total_won / self.total_wagered * 100), 2) if self.total_wagered > 0 else 0.0,
            "in_free_spins": self.in_free_spins,
            "free_spins_remaining": self.free_spins_remaining,
            "free_spins_total": self.free_spins_total,
            "free_spins_won_total": round(self.free_spins_won_total, 2),
        }


class SlotGame:
    def __init__(self, rng: Optional[SlotRNG] = None):
        self.rng = rng or SlotRNG()

    def spin(
        self,
        session: PlayerSession,
        bet_per_line: float = 1.0,
        num_lines: int = 20,
    ) -> Dict[str, Any]:
        """
        Execute one spin in the player's session.
        Handles both Base Game and Free Spins mode.
        """
        is_free_spin = session.in_free_spins and session.free_spins_remaining > 0

        if is_free_spin:
            # Free spin: Bet is locked to trigger bet, cost to player is 0
            effective_bet_per_line = session.free_spins_bet_per_line
            effective_num_lines = session.free_spins_num_lines
            wager = 0.0
            session.free_spins_remaining -= 1
        else:
            effective_bet_per_line = max(0.1, bet_per_line)
            effective_num_lines = max(1, min(20, num_lines))
            wager = effective_bet_per_line * effective_num_lines

            if session.balance < wager:
                raise ValueError(
                    f"Insufficient balance ({session.balance:.2f}) for bet ({wager:.2f})"
                )

            session.balance -= wager
            session.total_wagered += wager

        session.total_spins += 1

        # Generate stops and evaluate
        stops = get_random_stops(self.rng, is_free_spins=is_free_spin)
        grid = generate_grid_from_stops(stops, is_free_spins=is_free_spin)

        result = evaluate_grid(
            grid=grid,
            stops=stops,
            bet_per_line=effective_bet_per_line,
            num_lines=effective_num_lines,
            is_free_spin=is_free_spin,
        )

        # Apply win to player balance
        session.balance += result.total_win
        session.total_won += result.total_win

        if is_free_spin:
            session.free_spins_won_total += result.total_win
            # Check for retrigger in Free Spins
            if result.free_spins_won > 0:
                session.free_spins_remaining += result.free_spins_won
                session.free_spins_total += result.free_spins_won

            if session.free_spins_remaining == 0:
                session.in_free_spins = False
        else:
            # Check for Free Spins trigger in Base Game
            if result.free_spins_won > 0:
                session.in_free_spins = True
                session.free_spins_remaining = result.free_spins_won
                session.free_spins_total = result.free_spins_won
                session.free_spins_bet_per_line = effective_bet_per_line
                session.free_spins_num_lines = effective_num_lines
                session.free_spins_won_total = 0.0

        # Construct payload
        response = {
            "session": session.to_dict(),
            "spin_result": result.to_dict(),
        }

        # Keep history of last 20 spins
        session.history.insert(0, {
            "spin_number": session.total_spins,
            "wager": wager,
            "win": result.total_win,
            "is_free_spin": is_free_spin,
            "stops": stops,
        })
        if len(session.history) > 20:
            session.history.pop()

        return response
