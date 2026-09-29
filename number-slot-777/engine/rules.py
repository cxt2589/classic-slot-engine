"""
Rules, Betting Types, and Payout Multipliers for 5x3 Number Slot.
Only the Center Row (Row 1) is active for evaluation.
Numbers on reels: 1, 2, 3, 4, 5, 6, 7, 8, 9.
All multipliers calibrated for ~95% - 96% fair gaming RTP.
"""
from enum import Enum
from typing import Dict, List, Any


class BetType(str, Enum):
    # Tài / Xỉu on Sum (5..45)
    TAI = "TAI"            # Tổng 26 - 45
    XIU = "XIU"            # Tổng 5 - 24
    HOA_25 = "HOA_25"      # Tổng chính xác 25 (Hòa điểm)

    # Chẵn / Lẻ on Sum
    CHAN = "CHAN"          # Tổng là số chẵn
    LE = "LE"              # Tổng là số lẻ

    # Thùng (All Even or All Odd)
    THUNG = "THUNG"              # Toàn bộ là chẵn HOẶC toàn bộ là lẻ
    THUNG_CHAN = "THUNG_CHAN"    # Cả 5 số đều là Chẵn (2, 4, 6, 8)
    THUNG_LE = "THUNG_LE"        # Cả 5 số đều là Lẻ (1, 3, 5, 7, 9)

    # Sảnh (Straight - 5 consecutive numbers)
    SANH = "SANH"                # 5 số liên tiếp bất kỳ thứ tự (VD: 3-5-2-1-4)
    SANH_CHUAN = "SANH_CHUAN"    # 5 số liên tiếp tăng dần từ trái qua phải (VD: 1-2-3-4-5)

    # Tổ hợp Poker Numbers
    NGU_QUY = "NGU_QUY"          # 5 số giống nhau (VD: 7-7-7-7-7)
    TU_QUY = "TU_QUY"            # 4 số giống nhau (VD: 8-8-8-8-x)
    CU_LU = "CU_LU"              # Cù lũ: 3 số giống nhau + 1 đôi
    SAM_CO = "SAM_CO"            # Sám cô: 3 số giống nhau
    HAI_DOI = "HAI_DOI"          # 2 cặp số giống nhau
    MOT_DOI = "MOT_DOI"          # 1 cặp số giống nhau

    # Cược số cụ thể (1..9)
    SO_1 = "SO_1"
    SO_2 = "SO_2"
    SO_3 = "SO_3"
    SO_4 = "SO_4"
    SO_5 = "SO_5"
    SO_6 = "SO_6"
    SO_7 = "SO_7"
    SO_8 = "SO_8"
    SO_9 = "SO_9"


# Payout Multipliers for Fixed Betting Options (Return includes wager * multiplier)
BET_PAYOUTS: Dict[BetType, float] = {
    BetType.TAI: 2.05,
    BetType.XIU: 2.05,
    BetType.HOA_25: 14.1,

    BetType.CHAN: 1.92,
    BetType.LE: 1.92,

    BetType.THUNG: 13.6,
    BetType.THUNG_CHAN: 55.0,
    BetType.THUNG_LE: 18.0,

    BetType.SANH: 94.0,
    BetType.SANH_CHUAN: 5000.0,

    BetType.NGU_QUY: 5000.0,
    BetType.TU_QUY: 156.0,
    BetType.CU_LU: 78.0,
    BetType.SAM_CO: 11.2,
    BetType.HAI_DOI: 7.45,
    BetType.MOT_DOI: 1.86,
}

# Single Number Bet Payout Multipliers (based on count of matching digits 1..5)
SINGLE_NUMBER_PAYOUTS = {
    1: 1.7,
    2: 3.1,
    3: 7.5,
    4: 25.0,
    5: 100.0,
}

# Automatic Base Spin Hand Rankings & Multipliers (calibrated to exact 95.0% RTP)
BASE_HAND_PAYOUTS = {
    "NGU_QUY": 250.0,
    "SANH_CHUAN": 150.0,
    "TU_QUY": 16.0,
    "THUNG_CHAN": 4.5,
    "SANH": 8.0,
    "CU_LU": 6.0,
    "THUNG_LE": 2.4,
    "SAM_CO": 2.2,
    "HAI_DOI": 1.4,
    "MOT_DOI": 0.3,
}

NUMBER_COLORS = {
    1: "#00E5FF",  # Cyan
    2: "#76FF03",  # Neon Green
    3: "#FF9100",  # Orange
    4: "#2979FF",  # Blue
    5: "#D500F9",  # Purple
    6: "#FFD600",  # Yellow
    7: "#FF1744",  # Lucky Red 7
    8: "#00E676",  # Emerald
    9: "#FF3D00",  # Coral Fire
}
