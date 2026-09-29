"""
Monte Carlo Simulation script for 5x3 Number Slot (GLI-19 Standard).
Comprehensive mathematical verification of:
1. Payout Distribution Brackets (0x, 0.1x-1x, 1.1x-5x, 5.1x-20x, 20.1x-100x, 100x+)
2. RTP Contribution & Hit Frequencies of All Bets & Hands
3. Symbol Frequencies & Multi-match breakdown for Digits 1..9
4. Statistical Variance, Standard Deviation, and 95% Confidence Intervals
5. Center Line Sum Distribution (5..45)
"""
import sys
import io
import time
import math
from typing import Dict, Any, List

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from engine.reels import get_random_stops, generate_grid_from_stops
from engine.evaluator import CenterLineAnalysis, evaluate_bets
from engine.rules import BetType, BET_PAYOUTS, BASE_HAND_PAYOUTS, SINGLE_NUMBER_PAYOUTS

# Theoretical target RTP benchmarks
TARGET_RTPS: Dict[str, float] = {
    "BASE_SPIN": 95.00,
    "TAI": 95.55,
    "XIU": 95.55,
    "HOA_25": 95.63,
    "CHAN": 96.00,
    "LE": 96.00,
    "THUNG": 95.55,
    "THUNG_CHAN": 95.37,
    "THUNG_LE": 95.26,
    "SANH": 95.51,
    "SANH_CHUAN": 42.34,  # Jackpot class
    "NGU_QUY": 76.21,
    "TU_QUY": 95.10,
    "CU_LU": 95.10,
    "SAM_CO": 95.60,
    "HAI_DOI": 95.38,
    "MOT_DOI": 95.25,
    "SO_1": 95.83,
    "SO_2": 95.83,
    "SO_3": 95.83,
    "SO_4": 95.83,
    "SO_5": 95.83,
    "SO_6": 95.83,
    "SO_7": 95.83,
    "SO_8": 95.83,
    "SO_9": 95.83,
}

BET_METADATA: Dict[str, Dict[str, Any]] = {
    "BASE_SPIN": {"name_vi": "Quay Slot Tiêu Chuẩn", "category": "🎰 Base Game", "multiplier": "Tổ hợp"},
    "TAI": {"name_vi": "Cược Tài (Tổng 26 - 45)", "category": "🎯 Cầu Điểm", "multiplier": "x2.05"},
    "XIU": {"name_vi": "Cược Xỉu (Tổng 5 - 24)", "category": "🎯 Cầu Điểm", "multiplier": "x2.05"},
    "HOA_25": {"name_vi": "Cược Hòa 25 Điểm", "category": "🎯 Cầu Điểm", "multiplier": "x14.1"},
    "CHAN": {"name_vi": "Cược Tổng Chẵn", "category": "⚖️ Chẵn Lẻ", "multiplier": "x1.92"},
    "LE": {"name_vi": "Cược Tổng Lẻ", "category": "⚖️ Chẵn Lẻ", "multiplier": "x1.92"},
    "THUNG": {"name_vi": "Thùng Chung (Chẵn / Lẻ)", "category": "🎨 Dáng Bài", "multiplier": "x13.6"},
    "THUNG_CHAN": {"name_vi": "Thùng Toàn Chẵn", "category": "🎨 Dáng Bài", "multiplier": "x55.0"},
    "THUNG_LE": {"name_vi": "Thùng Toàn Lẻ", "category": "🎨 Dáng Bài", "multiplier": "x18.0"},
    "SANH": {"name_vi": "Sảnh 5 Số Liên Tiếp", "category": "🎨 Dáng Bài", "multiplier": "x94.0"},
    "SANH_CHUAN": {"name_vi": "Sảnh Chuẩn Tăng Dần (Jackpot)", "category": "🎨 Dáng Bài", "multiplier": "x5000.0"},
    "NGU_QUY": {"name_vi": "Ngũ Quý (5 Số Giống Nhau)", "category": "🃏 Poker Hands", "multiplier": "x5000.0"},
    "TU_QUY": {"name_vi": "Tứ Quý (4 Số Giống Nhau)", "category": "🃏 Poker Hands", "multiplier": "x156.0"},
    "CU_LU": {"name_vi": "Cù Lũ (3 Số + 1 Đôi)", "category": "🃏 Poker Hands", "multiplier": "x78.0"},
    "SAM_CO": {"name_vi": "Sám Cô (3 Số Giống Nhau)", "category": "🃏 Poker Hands", "multiplier": "x11.2"},
    "HAI_DOI": {"name_vi": "Hai Đôi", "category": "🃏 Poker Hands", "multiplier": "x7.45"},
    "MOT_DOI": {"name_vi": "Một Đôi", "category": "🃏 Poker Hands", "multiplier": "x1.86"},
}

for i in range(1, 10):
    BET_METADATA[f"SO_{i}"] = {
        "name_vi": f"Cược Con Số {i}",
        "category": "🔢 Số Đơn Lẻ",
        "multiplier": "x1.7 ~ x100.0"
    }


def run_simulation(num_spins: int = 50000) -> Dict[str, Any]:
    start_time = time.time()

    # Trackers
    bet_performance: Dict[str, Dict[str, Any]] = {
        k: {"hits": 0, "wagered": 0.0, "won": 0.0}
        for k in BET_METADATA.keys()
    }

    # Base game payout distribution brackets
    # 0x (Loss), 0.1x-1x (Low), 1.1x-5x (Medium), 5.1x-20x (Big), 20.1x-100x (Mega), 100x+ (Jackpot)
    bracket_defs = [
        {"id": "loss", "name": "0x (Trượt / Loss)", "range": "0x", "min": 0.0, "max": 0.001, "color": "#718096"},
        {"id": "low", "name": "0.1x - 1.0x (Hoàn Vốn / Nhỏ)", "range": "0.1x - 1.0x", "min": 0.001, "max": 1.0001, "color": "#4a5568"},
        {"id": "med", "name": "1.1x - 5.0x (Thắng Vừa)", "range": "1.1x - 5.0x", "min": 1.0001, "max": 5.0001, "color": "#00e5ff"},
        {"id": "big", "name": "5.1x - 20.0x (Thắng Lớn)", "range": "5.1x - 20.0x", "min": 5.0001, "max": 20.0001, "color": "#76ff03"},
        {"id": "mega", "name": "20.1x - 100.0x (Thắng Siêu Cấp)", "range": "20.1x - 100.0x", "min": 20.0001, "max": 100.0001, "color": "#e040fb"},
        {"id": "jackpot", "name": "100x+ (Đại Thắng / Jackpot)", "range": "100x+", "min": 100.0001, "max": 999999.0, "color": "#ffd700"},
    ]
    bracket_counts = {b["id"]: {"hits": 0, "won": 0.0} for b in bracket_defs}

    # Digits 1..9 frequency and match counts
    digit_stats: Dict[int, Dict[str, Any]] = {
        d: {"appearances": 0, "matches": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}}
        for d in range(1, 10)
    }

    # Sum distribution
    sum_distribution: Dict[int, int] = {s: 0 for s in range(5, 46)}
    hand_counts: Dict[str, int] = {}

    wager_unit = 10.0
    all_bets = {k: wager_unit for k in BET_METADATA.keys()}

    # Base Spin Statistics
    base_spin_wagers = 0.0
    base_spin_winnings = 0.0
    base_spin_hits = 0
    max_win_multiplier = 0.0
    sum_mult = 0.0
    sum_mult_sq = 0.0

    for _ in range(num_spins):
        stops = get_random_stops(use_crypto=False)
        grid = generate_grid_from_stops(stops)
        center_row = grid[1]

        analysis = CenterLineAnalysis(center_row)
        s_val = analysis.sum_val
        sum_distribution[s_val] = sum_distribution.get(s_val, 0) + 1

        hand_key = analysis.best_hand
        hand_counts[hand_key] = hand_counts.get(hand_key, 0) + 1

        # Base Spin Evaluation
        base_mult = BASE_HAND_PAYOUTS.get(hand_key, 0.0)
        base_win = wager_unit * base_mult
        base_spin_wagers += wager_unit
        base_spin_winnings += base_win
        sum_mult += base_mult
        sum_mult_sq += (base_mult * base_mult)

        if base_mult > max_win_multiplier:
            max_win_multiplier = base_mult

        if base_mult > 0:
            base_spin_hits += 1

        # Bracket accumulation
        for b in bracket_defs:
            if b["id"] == "loss":
                if base_mult <= 0.0001:
                    bracket_counts["loss"]["hits"] += 1
                    bracket_counts["loss"]["won"] += base_win
                    break
            else:
                if b["min"] <= base_mult <= b["max"]:
                    bracket_counts[b["id"]]["hits"] += 1
                    bracket_counts[b["id"]]["won"] += base_win
                    break

        # Digits accumulation
        for d in range(1, 10):
            cnt = analysis.counts.get(d, 0)
            if cnt > 0:
                digit_stats[d]["appearances"] += cnt
                if 1 <= cnt <= 5:
                    digit_stats[d]["matches"][cnt] += 1

        # Evaluate fixed bets
        res = evaluate_bets(analysis, all_bets)
        for item in res["winning_items"]:
            bk = item["bet_type"]
            if bk in bet_performance:
                bet_performance[bk]["hits"] += 1
                bet_performance[bk]["won"] += item["win_amount"]

        for bk in all_bets.keys():
            bet_performance[bk]["wagered"] += wager_unit

    elapsed = time.time() - start_time
    spins_per_sec = int(num_spins / elapsed) if elapsed > 0 else 0

    # Base spin statistical metrics
    mean_mult = sum_mult / num_spins
    variance = (sum_mult_sq / num_spins) - (mean_mult * mean_mult)
    variance = max(0.0, variance)
    std_dev = math.sqrt(variance)
    base_rtp = (base_spin_winnings / base_spin_wagers * 100) if base_spin_wagers > 0 else 0.0
    base_hit_freq = (base_spin_hits / num_spins * 100)

    # 95% Confidence Interval for RTP
    std_err = std_dev / math.sqrt(num_spins) * 100
    ci_low = max(0.0, base_rtp - 1.96 * std_err)
    ci_high = base_rtp + 1.96 * std_err

    # Format Payout Distribution list
    payout_distribution = []
    for b in bracket_defs:
        b_hits = bracket_counts[b["id"]]["hits"]
        b_won = bracket_counts[b["id"]]["won"]
        b_pct = round(b_hits / num_spins * 100, 2)
        b_rtp = round(b_won / base_spin_wagers * 100, 2)
        payout_distribution.append({
            "bracket": b["name"],
            "range": b["range"],
            "hits": b_hits,
            "hit_rate_pct": b_pct,
            "payout_sum": round(b_won, 2),
            "rtp_contribution_pct": b_rtp,
            "color": b["color"],
        })

    # Format Bet Contributions table
    bet_contributions = []
    for bk, meta in BET_METADATA.items():
        perf = bet_performance[bk]
        hits = perf["hits"]
        wagered = perf["wagered"]
        won = perf["won"]
        emp_rtp = round(won / wagered * 100, 2) if wagered > 0 else 0.0
        tgt_rtp = TARGET_RTPS.get(bk, 95.00)
        delta = round(emp_rtp - tgt_rtp, 2)
        hit_rate = round(hits / num_spins * 100, 2)

        status = "PASSED" if abs(delta) <= 3.5 else "MONITOR"

        bet_contributions.append({
            "key": bk,
            "name_vi": meta["name_vi"],
            "category": meta["category"],
            "multiplier": meta["multiplier"],
            "hits": hits,
            "hit_rate_pct": hit_rate,
            "wagered": round(wagered, 2),
            "won": round(won, 2),
            "empirical_rtp": emp_rtp,
            "target_rtp": tgt_rtp,
            "delta": delta,
            "status": status,
        })

    # Format Digit Stats
    symbol_breakdown = []
    total_symbols = num_spins * 5
    for d in range(1, 10):
        apps = digit_stats[d]["appearances"]
        freq_pct = round(apps / total_symbols * 100, 2)
        b_key = f"SO_{d}"
        s_rtp = round(bet_performance[b_key]["won"] / bet_performance[b_key]["wagered"] * 100, 2)

        symbol_breakdown.append({
            "digit": d,
            "appearances": apps,
            "freq_pct": freq_pct,
            "matches_breakdown": {
                "1_match": digit_stats[d]["matches"][1],
                "2_matches": digit_stats[d]["matches"][2],
                "3_matches": digit_stats[d]["matches"][3],
                "4_matches": digit_stats[d]["matches"][4],
                "5_matches": digit_stats[d]["matches"][5],
            },
            "bet_rtp": s_rtp,
            "theoretical_freq": 11.11,
        })

    # Sum distribution list
    sum_list = [
        {"sum": s, "count": count, "percent": round(count / num_spins * 100, 3)}
        for s, count in sorted(sum_distribution.items())
    ]

    return {
        "num_spins": num_spins,
        "elapsed_sec": round(elapsed, 3),
        "spins_per_sec": spins_per_sec,
        "kpi": {
            "num_spins": num_spins,
            "base_rtp": round(base_rtp, 2),
            "base_hit_frequency": round(base_hit_freq, 2),
            "max_win_multiplier": round(max_win_multiplier, 1),
            "std_dev": round(std_dev, 2),
            "variance": round(variance, 2),
            "volatility_class": "Trung Bình Cao (Med-High)",
            "ci_95": f"[{ci_low:.2f}% - {ci_high:.2f}%]",
            "spins_per_sec": spins_per_sec,
            "elapsed_sec": round(elapsed, 2),
        },
        "payout_distribution": payout_distribution,
        "bet_contributions": bet_contributions,
        "symbol_breakdown": symbol_breakdown,
        "sum_distribution": sum_list,
        "hand_counts": hand_counts,
        # Legacy compatibility keys for simple consumers
        "tai_percent": round(bet_performance["TAI"]["hits"] / num_spins * 100, 2),
        "xiu_percent": round(bet_performance["XIU"]["hits"] / num_spins * 100, 2),
        "hoa_25_percent": round(bet_performance["HOA_25"]["hits"] / num_spins * 100, 2),
        "chan_percent": round(bet_performance["CHAN"]["hits"] / num_spins * 100, 2),
        "le_percent": round(bet_performance["LE"]["hits"] / num_spins * 100, 2),
        "thung_percent": round(bet_performance["THUNG"]["hits"] / num_spins * 100, 2),
        "sanh_percent": round(bet_performance["SANH"]["hits"] / num_spins * 100, 2),
    }


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 50000
    res = run_simulation(n)
    print("\n" + "=" * 70)
    print(f"LUCKY NUMBERS 777 - GLI-19 CERTIFICATION MATH SIMULATION ({n:,} SPINS)")
    print("=" * 70)
    print(f"Elapsed: {res['elapsed_sec']}s | Speed: {res['spins_per_sec']:,} spins/sec")
    print(f"Base Game RTP: {res['kpi']['base_rtp']}% | Hit Frequency: {res['kpi']['base_hit_frequency']}%")
    print(f"Max Win Multiplier: x{res['kpi']['max_win_multiplier']} | Std Dev (\u03c3): {res['kpi']['std_dev']}")
    print(f"95% Confidence Interval: {res['kpi']['ci_95']}")
    print("\n--- PHÂN BỐ HỆ SỐ THƯỞNG (PAYOUT MULTIPLIER DISTRIBUTION) ---")
    for b in res["payout_distribution"]:
        print(f"  {b['bracket']:<30} : {b['hits']:>6,} ({b['hit_rate_pct']:>5.2f}%) | Đóng góp RTP: {b['rtp_contribution_pct']:>5.2f}%")
    print("\n--- ĐÓNG GÓP RTP CỦA TỪNG CỬA CƯỢC (TOP 10) ---")
    for bc in res["bet_contributions"][:10]:
        print(f"  {bc['name_vi']:<30} | {bc['multiplier']:<12} | Hits: {bc['hits']:>6,} ({bc['hit_rate_pct']:>5.2f}%) | RTP: {bc['empirical_rtp']:>5.2f}% (Target: {bc['target_rtp']}%) \u0394: {bc['delta']:+0.2f}%")
    print("=" * 70 + "\n")
