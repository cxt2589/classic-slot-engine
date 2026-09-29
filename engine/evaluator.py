"""
Evaluation engine for slot paylines, wild substitutions, scatter payouts, and free spins.
"""
from typing import List, Dict, Any, Optional
from engine.symbols import (
    Symbol, PAYTABLE, SCATTER_PAYOUT, FREE_SPINS_AWARDED, FREE_SPINS_WIN_MULTIPLIER
)
from engine.paylines import get_paylines


class LineWin:
    def __init__(
        self,
        line_index: int,
        symbol: Symbol,
        count: int,
        multiplier: float,
        win_amount: float,
        positions: List[List[int]],
    ):
        self.line_index = line_index
        self.symbol = symbol
        self.count = count
        self.multiplier = multiplier
        self.win_amount = win_amount
        self.positions = positions

    def to_dict(self) -> Dict[str, Any]:
        return {
            "line_index": self.line_index,
            "symbol": self.symbol.value,
            "count": self.count,
            "multiplier": self.multiplier,
            "win_amount": round(self.win_amount, 2),
            "positions": self.positions,
        }


class ScatterWin:
    def __init__(
        self,
        count: int,
        multiplier: float,
        win_amount: float,
        free_spins: int,
        positions: List[List[int]],
    ):
        self.count = count
        self.multiplier = multiplier
        self.win_amount = win_amount
        self.free_spins = free_spins
        self.positions = positions

    def to_dict(self) -> Dict[str, Any]:
        return {
            "count": self.count,
            "multiplier": self.multiplier,
            "win_amount": round(self.win_amount, 2),
            "free_spins": self.free_spins,
            "positions": self.positions,
        }


class SpinResult:
    def __init__(
        self,
        grid: List[List[Symbol]],
        stops: List[int],
        bet_per_line: float,
        num_lines: int,
        total_bet: float,
        line_wins: List[LineWin],
        scatter_win: Optional[ScatterWin],
        is_free_spin: bool = False,
    ):
        self.grid = grid
        self.stops = stops
        self.bet_per_line = bet_per_line
        self.num_lines = num_lines
        self.total_bet = total_bet
        self.line_wins = line_wins
        self.scatter_win = scatter_win
        self.is_free_spin = is_free_spin

        self.line_wins_total = sum(w.win_amount for w in line_wins)
        self.scatter_win_total = scatter_win.win_amount if scatter_win else 0.0
        self.total_win = self.line_wins_total + self.scatter_win_total
        self.free_spins_won = scatter_win.free_spins if scatter_win else 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "grid": [[s.value for s in row] for row in self.grid],
            "stops": self.stops,
            "bet_per_line": self.bet_per_line,
            "num_lines": self.num_lines,
            "total_bet": self.total_bet,
            "total_win": round(self.total_win, 2),
            "is_free_spin": self.is_free_spin,
            "free_spins_won": self.free_spins_won,
            "line_wins": [w.to_dict() for w in self.line_wins],
            "scatter_win": self.scatter_win.to_dict() if self.scatter_win else None,
        }


def evaluate_grid(
    grid: List[List[Symbol]],
    stops: List[int],
    bet_per_line: float = 1.0,
    num_lines: int = 20,
    is_free_spin: bool = False,
) -> SpinResult:
    """
    Evaluate visible 3x5 grid against paylines and scatter payout.
    """
    active_paylines = get_paylines(num_lines)
    total_bet = bet_per_line * num_lines if not is_free_spin else 0.0
    effective_bet = bet_per_line * num_lines  # Used to scale scatter win even in free spins

    win_multiplier_factor = FREE_SPINS_WIN_MULTIPLIER if is_free_spin else 1.0
    line_wins: List[LineWin] = []

    # 1. Evaluate Paylines
    for line_idx, pattern in enumerate(active_paylines):
        line_symbols = [grid[pattern[col]][col] for col in range(5)]

        # Check pure WILD sequence
        wild_count = 0
        for sym in line_symbols:
            if sym == Symbol.WILD:
                wild_count += 1
            else:
                break
        wild_payout = PAYTABLE[Symbol.WILD].get(wild_count, 0.0)

        # Check substitution with first non-wild symbol
        target_sym: Optional[Symbol] = None
        for sym in line_symbols:
            if sym != Symbol.WILD:
                target_sym = sym
                break

        target_count = 0
        target_payout = 0.0
        if target_sym is not None and target_sym != Symbol.SCATTER:
            for sym in line_symbols:
                if sym == target_sym or sym == Symbol.WILD:
                    target_count += 1
                else:
                    break
            target_payout = PAYTABLE[target_sym].get(target_count, 0.0)

        # Determine winner: highest payout
        if target_payout > wild_payout:
            winning_symbol = target_sym
            winning_count = target_count
            base_multiplier = target_payout
        elif wild_payout > 0.0:
            winning_symbol = Symbol.WILD
            winning_count = wild_count
            base_multiplier = wild_payout
        else:
            base_multiplier = 0.0

        if base_multiplier > 0.0 and winning_symbol is not None:
            win_amount = base_multiplier * bet_per_line * win_multiplier_factor
            positions = [[pattern[c], c] for c in range(winning_count)]
            line_wins.append(
                LineWin(
                    line_index=line_idx,
                    symbol=winning_symbol,
                    count=winning_count,
                    multiplier=base_multiplier * win_multiplier_factor,
                    win_amount=win_amount,
                    positions=positions,
                )
            )

    # 2. Evaluate Scatter
    scatter_positions = []
    for r in range(3):
        for c in range(5):
            if grid[r][c] == Symbol.SCATTER:
                scatter_positions.append([r, c])

    scatter_count = len(scatter_positions)
    scatter_win: Optional[ScatterWin] = None

    if scatter_count >= 3:
        scatter_mult = SCATTER_PAYOUT.get(scatter_count, 0.0)
        scatter_amount = scatter_mult * effective_bet
        free_spins = FREE_SPINS_AWARDED.get(scatter_count, 0)
        scatter_win = ScatterWin(
            count=scatter_count,
            multiplier=scatter_mult,
            win_amount=scatter_amount,
            free_spins=free_spins,
            positions=scatter_positions,
        )

    return SpinResult(
        grid=grid,
        stops=stops,
        bet_per_line=bet_per_line,
        num_lines=num_lines,
        total_bet=total_bet,
        line_wins=line_wins,
        scatter_win=scatter_win,
        is_free_spin=is_free_spin,
    )
