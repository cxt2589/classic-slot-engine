"""
Monte Carlo Simulation script for Classic 5x3 Retro Slot.
Evaluates RTP, Hit Frequency, Volatility, and Feature statistics over N spins.
"""
import sys
import io
import time
import math
from typing import Dict, Any

# Ensure UTF-8 output encoding on Windows console
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from engine.symbols import Symbol
from engine.rng import SlotRNG
from engine.reels import get_random_stops, generate_grid_from_stops
from engine.evaluator import evaluate_grid


def run_simulation(num_spins: int = 50000, bet_per_line: float = 1.0, num_lines: int = 20, seed: int = 42) -> Dict[str, Any]:
    print(f"=== Starting Monte Carlo Simulation: {num_spins:,} base spins ===")
    start_time = time.time()

    rng = SlotRNG(seed=seed)
    total_wagered = 0.0
    total_won = 0.0

    base_wagered = 0.0
    base_won = 0.0
    free_won = 0.0

    hit_count = 0
    free_spin_triggers = 0
    total_free_spins_played = 0

    max_win = 0.0
    win_multipliers = []

    # Distribution brackets
    distribution = {
        "0x (Loss)": 0,
        "0.1x - 1x": 0,
        "1x - 5x": 0,
        "5x - 20x": 0,
        "20x - 100x": 0,
        "100x+ (Big Win)": 0,
    }

    symbol_win_amounts: Dict[str, float] = {}

    wager_per_spin = bet_per_line * num_lines

    for spin_idx in range(num_spins):
        # 1. Base Spin
        base_wagered += wager_per_spin
        total_wagered += wager_per_spin

        stops = get_random_stops(rng, is_free_spins=False)
        grid = generate_grid_from_stops(stops, is_free_spins=False)
        base_result = evaluate_grid(grid, stops, bet_per_line, num_lines, is_free_spin=False)

        spin_total_win = base_result.total_win
        base_won += base_result.total_win

        for lw in base_result.line_wins:
            sym_key = lw.symbol.value
            symbol_win_amounts[sym_key] = symbol_win_amounts.get(sym_key, 0.0) + lw.win_amount

        if base_result.scatter_win:
            symbol_win_amounts["SCATTER_BASE"] = symbol_win_amounts.get("SCATTER_BASE", 0.0) + base_result.scatter_win.win_amount

        # 2. Check for Free Spins trigger
        free_spins_queue = base_result.free_spins_won
        if free_spins_queue > 0:
            free_spin_triggers += 1

        # Play all free spins triggered (including retriggers)
        while free_spins_queue > 0:
            total_free_spins_played += 1
            free_spins_queue -= 1

            fs_stops = get_random_stops(rng, is_free_spins=True)
            fs_grid = generate_grid_from_stops(fs_stops, is_free_spins=True)
            fs_result = evaluate_grid(fs_grid, fs_stops, bet_per_line, num_lines, is_free_spin=True)

            free_won += fs_result.total_win
            spin_total_win += fs_result.total_win

            for lw in fs_result.line_wins:
                sym_key = lw.symbol.value + "_FREE"
                symbol_win_amounts[sym_key] = symbol_win_amounts.get(sym_key, 0.0) + lw.win_amount

            if fs_result.scatter_win:
                symbol_win_amounts["SCATTER_FREE"] = symbol_win_amounts.get("SCATTER_FREE", 0.0) + fs_result.scatter_win.win_amount

            if fs_result.free_spins_won > 0:
                free_spins_queue += fs_result.free_spins_won

        total_won += spin_total_win

        if spin_total_win > 0:
            hit_count += 1

        if spin_total_win > max_win:
            max_win = spin_total_win

        multiplier = spin_total_win / wager_per_spin
        win_multipliers.append(multiplier)

        # Categorize
        if multiplier == 0:
            distribution["0x (Loss)"] += 1
        elif multiplier <= 1.0:
            distribution["0.1x - 1x"] += 1
        elif multiplier <= 5.0:
            distribution["1x - 5x"] += 1
        elif multiplier <= 20.0:
            distribution["5x - 20x"] += 1
        elif multiplier <= 100.0:
            distribution["20x - 100x"] += 1
        else:
            distribution["100x+ (Big Win)"] += 1

        if (spin_idx + 1) % (num_spins // 5) == 0:
            current_rtp = (total_won / total_wagered) * 100
            print(f"Progress: {(spin_idx + 1):,} / {num_spins:,} spins | Current RTP: {current_rtp:.2f}%")

    elapsed = time.time() - start_time
    total_rtp = (total_won / total_wagered) * 100
    base_rtp = (base_won / total_wagered) * 100
    free_rtp = (free_won / total_wagered) * 100
    hit_frequency = (hit_count / num_spins) * 100

    # Calculate Volatility (Standard Deviation of return)
    mean_return = total_won / total_wagered
    variance = sum((m - mean_return) ** 2 for m in win_multipliers) / num_spins
    std_dev = math.sqrt(variance)
    volatility_index = std_dev * 1.96

    print("\n" + "=" * 55)
    print("           MONTE CARLO SIMULATION REPORT         ")
    print("=" * 55)
    print(f"Total Spins Simulated     : {num_spins:,}")
    print(f"Execution Time            : {elapsed:.2f} s ({int(num_spins / elapsed):,} spins/sec)")
    print(f"Total RTP                 : {total_rtp:.2f}% (Target: 95.0% - 97.0%)")
    print(f"  |-- Base Game RTP       : {base_rtp:.2f}%")
    print(f"  `-- Free Spins RTP      : {free_rtp:.2f}%")
    print(f"Hit Frequency             : {hit_frequency:.2f}% (1 win every ~{100 / hit_frequency:.1f} spins)")
    print(f"Free Spins Trigger Ratio  : 1 in {int(num_spins / free_spin_triggers) if free_spin_triggers > 0 else 0}")
    print(f"Total Free Spins Played   : {total_free_spins_played:,}")
    print(f"Max Win Multiplier        : {round(max_win / wager_per_spin, 2)}x")
    print(f"Volatility Index (95% CI) : {volatility_index:.2f} (Standard Dev: {std_dev:.2f})")
    print("\n--- Win Multiplier Distribution ---")
    for k, v in distribution.items():
        print(f"  {k:<18}: {v:,} ({v / num_spins * 100:.1f}%)")
    print("\n--- Symbol Contribution to RTP ---")
    for sym, amt in sorted(symbol_win_amounts.items(), key=lambda x: x[1], reverse=True)[:10]:
        contrib_rtp = (amt / total_wagered) * 100
        print(f"  {sym:<18}: {contrib_rtp:.2f}% RTP")
    print("=" * 55 + "\n")

    return {
        "num_spins": num_spins,
        "elapsed_sec": round(elapsed, 2),
        "spins_per_sec": int(num_spins / elapsed) if elapsed > 0 else 0,
        "total_wagered": round(total_wagered, 2),
        "total_won": round(total_won, 2),
        "total_rtp_percent": round(total_rtp, 2),
        "base_game_rtp_percent": round(base_rtp, 2),
        "free_spins_rtp_percent": round(free_rtp, 2),
        "hit_frequency_percent": round(hit_frequency, 2),
        "free_spin_triggers": free_spin_triggers,
        "free_spin_trigger_ratio": f"1 in {int(num_spins / free_spin_triggers)}" if free_spin_triggers > 0 else "N/A",
        "total_free_spins_played": total_free_spins_played,
        "max_win_multiplier": round(max_win / wager_per_spin, 2),
        "volatility_index": round(volatility_index, 2),
        "standard_deviation": round(std_dev, 2),
        "distribution": {k: f"{v:,} ({v / num_spins * 100:.1f}%)" for k, v in distribution.items()},
        "symbol_hits": {sym: round((amt / total_wagered) * 100, 2) for sym, amt in sorted(symbol_win_amounts.items(), key=lambda x: x[1], reverse=True)[:10]},
    }


if __name__ == "__main__":
    spins = int(sys.argv[1]) if len(sys.argv) > 1 else 50000
    run_simulation(num_spins=spins)
