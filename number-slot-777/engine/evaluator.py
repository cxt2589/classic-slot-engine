"""
Evaluation engine for 5x3 Number Slot.
Analyzes the 5 numbers on the Center Row (Row 1).
Evaluates Tài/Xỉu, Chẵn/Lẻ, Thùng, Sảnh, Poker Number Hands, and Single Number Bets.
"""
from typing import List, Dict, Any, Optional
from collections import Counter
from engine.rules import BetType, BET_PAYOUTS, SINGLE_NUMBER_PAYOUTS, BASE_HAND_PAYOUTS


class CenterLineAnalysis:
    """Detailed statistical and rule-based breakdown of the 5 numbers on Row 1."""

    def __init__(self, numbers: List[int]):
        self.numbers = numbers
        self.sum_val = sum(numbers)

        # Tài / Xỉu
        self.is_tai = self.sum_val > 25
        self.is_xiu = self.sum_val < 25
        self.is_hoa_25 = self.sum_val == 25

        # Chẵn / Lẻ
        self.is_chan = (self.sum_val % 2 == 0)
        self.is_le = (self.sum_val % 2 != 0)

        # Thùng (All Even / All Odd)
        self.is_thung_chan = all(n % 2 == 0 for n in numbers)
        self.is_thung_le = all(n % 2 != 0 for n in numbers)
        self.is_thung = self.is_thung_chan or self.is_thung_le

        # Sảnh (Straight)
        self.is_sanh_chuan = numbers in (
            [1, 2, 3, 4, 5], [2, 3, 4, 5, 6], [3, 4, 5, 6, 7], [4, 5, 6, 7, 8], [5, 6, 7, 8, 9]
        )
        sorted_nums = sorted(numbers)
        self.is_sanh = sorted_nums in (
            [1, 2, 3, 4, 5], [2, 3, 4, 5, 6], [3, 4, 5, 6, 7], [4, 5, 6, 7, 8], [5, 6, 7, 8, 9]
        )

        # Poker Combinations
        self.counts = Counter(numbers)
        freqs = sorted(self.counts.values(), reverse=True)

        self.is_ngu_quy = (freqs == [5])
        self.is_tu_quy = (freqs == [4, 1])
        self.is_cu_lu = (freqs == [3, 2])
        self.is_sam_co = (freqs == [3, 1, 1])
        self.is_hai_doi = (freqs == [2, 2, 1])
        self.is_mot_doi = (freqs == [2, 1, 1, 1])

        # Determine Primary Best Base Hand
        if self.is_ngu_quy:
            self.best_hand = "NGU_QUY"
            self.hand_title_vi = "Ngũ Quý (5 Số Giống Nhau)"
        elif self.is_sanh_chuan:
            self.best_hand = "SANH_CHUAN"
            self.hand_title_vi = "Sảnh Chuẩn (1-2-3-4-5 Tăng Dần)"
        elif self.is_tu_quy:
            self.best_hand = "TU_QUY"
            self.hand_title_vi = "Tứ Quý (4 Số Giống Nhau)"
        elif self.is_thung_chan:
            self.best_hand = "THUNG_CHAN"
            self.hand_title_vi = "Thùng Toàn Chẵn"
        elif self.is_sanh:
            self.best_hand = "SANH"
            self.hand_title_vi = "Sảnh Tự Do (5 Số Liên Tiếp)"
        elif self.is_cu_lu:
            self.best_hand = "CU_LU"
            self.hand_title_vi = "Cù Lũ (3 Số + 1 Đôi)"
        elif self.is_thung_le:
            self.best_hand = "THUNG_LE"
            self.hand_title_vi = "Thùng Toàn Lẻ"
        elif self.is_sam_co:
            self.best_hand = "SAM_CO"
            self.hand_title_vi = "Sám Cô (3 Số Giống Nhau)"
        elif self.is_hai_doi:
            self.best_hand = "HAI_DOI"
            self.hand_title_vi = "Hai Đôi"
        elif self.is_mot_doi:
            self.best_hand = "MOT_DOI"
            self.hand_title_vi = "Một Đôi"
        else:
            self.best_hand = "MAU_THAU"
            self.hand_title_vi = "Số Rời (Không tạo tổ hợp)"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "numbers": self.numbers,
            "sum": self.sum_val,
            "is_tai": self.is_tai,
            "is_xiu": self.is_xiu,
            "is_hoa_25": self.is_hoa_25,
            "is_chan": self.is_chan,
            "is_le": self.is_le,
            "is_thung": self.is_thung,
            "is_thung_chan": self.is_thung_chan,
            "is_thung_le": self.is_thung_le,
            "is_sanh": self.is_sanh,
            "is_sanh_chuan": self.is_sanh_chuan,
            "best_hand": self.best_hand,
            "hand_title_vi": self.hand_title_vi,
            "counts": dict(self.counts),
        }


def evaluate_bets(analysis: CenterLineAnalysis, bets: Dict[str, float]) -> Dict[str, Any]:
    """
    Evaluate player bets against center line analysis.
    Returns list of won bets, multipliers, amounts, and total payout.
    """
    total_bet = sum(bets.values())
    winning_items = []
    total_won = 0.0

    for bet_key, wager in bets.items():
        if wager <= 0:
            continue

        payout_multiplier = 0.0
        reason_vi = ""

        # 1. Base Spin Bet (Evaluates against best base hand)
        if bet_key == "BASE_SPIN":
            hand = analysis.best_hand
            if hand in BASE_HAND_PAYOUTS:
                payout_multiplier = BASE_HAND_PAYOUTS[hand]
                reason_vi = f"Trúng {analysis.hand_title_vi}"

        # 2. Tài / Xỉu
        elif bet_key == BetType.TAI.value and analysis.is_tai:
            payout_multiplier = BET_PAYOUTS[BetType.TAI]
            reason_vi = f"Tổng {analysis.sum_val} > 25 (TÀI)"
        elif bet_key == BetType.XIU.value and analysis.is_xiu:
            payout_multiplier = BET_PAYOUTS[BetType.XIU]
            reason_vi = f"Tổng {analysis.sum_val} < 25 (XỈU)"
        elif bet_key == BetType.HOA_25.value and analysis.is_hoa_25:
            payout_multiplier = BET_PAYOUTS[BetType.HOA_25]
            reason_vi = "Tổng chính xác 25 điểm"

        # 3. Chẵn / Lẻ
        elif bet_key == BetType.CHAN.value and analysis.is_chan:
            payout_multiplier = BET_PAYOUTS[BetType.CHAN]
            reason_vi = f"Tổng {analysis.sum_val} là số CHẴN"
        elif bet_key == BetType.LE.value and analysis.is_le:
            payout_multiplier = BET_PAYOUTS[BetType.LE]
            reason_vi = f"Tổng {analysis.sum_val} là số LẺ"

        # 4. Thùng
        elif bet_key == BetType.THUNG.value and analysis.is_thung:
            payout_multiplier = BET_PAYOUTS[BetType.THUNG]
            reason_vi = "Toàn Chẵn hoặc Toàn Lẻ (THÙNG)"
        elif bet_key == BetType.THUNG_CHAN.value and analysis.is_thung_chan:
            payout_multiplier = BET_PAYOUTS[BetType.THUNG_CHAN]
            reason_vi = "Cả 5 số đều là CHẴN (THÙNG CHẴN)"
        elif bet_key == BetType.THUNG_LE.value and analysis.is_thung_le:
            payout_multiplier = BET_PAYOUTS[BetType.THUNG_LE]
            reason_vi = "Cả 5 số đều là LẺ (THÙNG LẺ)"

        # 5. Sảnh
        elif bet_key == BetType.SANH.value and analysis.is_sanh:
            payout_multiplier = BET_PAYOUTS[BetType.SANH]
            reason_vi = "5 số tạo thành chuỗi liên tiếp (SẢNH)"
        elif bet_key == BetType.SANH_CHUAN.value and analysis.is_sanh_chuan:
            payout_multiplier = BET_PAYOUTS[BetType.SANH_CHUAN]
            reason_vi = "5 số tăng dần từ trái qua phải (SẢNH CHUẨN)"

        # 6. Poker Combinations
        elif bet_key == BetType.NGU_QUY.value and analysis.is_ngu_quy:
            payout_multiplier = BET_PAYOUTS[BetType.NGU_QUY]
            reason_vi = "Ngũ Quý (5 số giống nhau)"
        elif bet_key == BetType.TU_QUY.value and (analysis.is_tu_quy or analysis.is_ngu_quy):
            payout_multiplier = BET_PAYOUTS[BetType.TU_QUY]
            reason_vi = "Tứ Quý (4 số giống nhau)"
        elif bet_key == BetType.CU_LU.value and analysis.is_cu_lu:
            payout_multiplier = BET_PAYOUTS[BetType.CU_LU]
            reason_vi = "Cù Lũ (3 số + 1 đôi)"
        elif bet_key == BetType.SAM_CO.value and (analysis.is_sam_co or analysis.is_tu_quy or analysis.is_ngu_quy):
            payout_multiplier = BET_PAYOUTS[BetType.SAM_CO]
            reason_vi = "Sám Cô (3 số giống nhau)"
        elif bet_key == BetType.HAI_DOI.value and (analysis.is_hai_doi or analysis.is_cu_lu):
            payout_multiplier = BET_PAYOUTS[BetType.HAI_DOI]
            reason_vi = "Hai Đôi"
        elif bet_key == BetType.MOT_DOI.value and (analysis.is_mot_doi or analysis.is_hai_doi or analysis.is_sam_co or analysis.is_cu_lu or analysis.is_tu_quy or analysis.is_ngu_quy):
            payout_multiplier = BET_PAYOUTS[BetType.MOT_DOI]
            reason_vi = "Một Đôi"

        # 7. Single Number Bets (SO_1 to SO_9)
        elif bet_key.startswith("SO_"):
            try:
                target_digit = int(bet_key.split("_")[1])
                match_count = analysis.counts.get(target_digit, 0)
                if match_count > 0:
                    payout_multiplier = SINGLE_NUMBER_PAYOUTS.get(match_count, 150.0)
                    reason_vi = f"Số {target_digit} xuất hiện {match_count} lần"
            except (ValueError, IndexError):
                pass

        if payout_multiplier > 0:
            win_amount = round(wager * payout_multiplier, 2)
            total_won += win_amount
            winning_items.append({
                "bet_type": bet_key,
                "wager": wager,
                "multiplier": payout_multiplier,
                "win_amount": win_amount,
                "reason_vi": reason_vi,
            })

    total_won = round(total_won, 2)
    return {
        "total_bet": total_bet,
        "total_won": total_won,
        "net_profit": round(total_won - total_bet, 2),
        "winning_items": winning_items,
    }
