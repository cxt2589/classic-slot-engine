"""
Symbol definitions, paytables, and payout rules for 5x3 Retro Classic Slot.
Engineered for exact 96.0% - 96.2% Industry Standard RTP with 20 Paylines and Free Spins feature.
"""
from enum import Enum
from typing import Dict, List, Any


class Symbol(str, Enum):
    WILD = "WILD"          # Thay thế mọi biểu tượng trừ Scatter; có payline riêng
    SCATTER = "SCATTER"    # Ngôi sao vàng - thưởng trên cược tổng & kích hoạt Free Spins
    SEVEN = "SEVEN"        # Số 7 đỏ may mắn (Top Symbol)
    DIAMOND = "DIAMOND"    # Kim cương xanh
    BELL = "BELL"          # Chuông vàng Liberty
    BAR_3 = "BAR_3"        # Triple BAR
    BAR_2 = "BAR_2"        # Double BAR
    BAR_1 = "BAR_1"        # Single BAR
    WATERMELON = "WATERMELON" # Dưa hấu
    GRAPE = "GRAPE"        # Nho
    PLUM = "PLUM"          # Mận
    ORANGE = "ORANGE"      # Cam
    CHERRY = "CHERRY"      # Cherry


SYMBOL_META: Dict[Symbol, Dict[str, Any]] = {
    Symbol.WILD: {
        "name_vi": "Vương Miện Wild",
        "name_en": "Crown Wild",
        "icon": "👑",
        "color": "#FFD700",
        "is_wild": True,
        "is_scatter": False,
    },
    Symbol.SCATTER: {
        "name_vi": "Ngôi Sao Scatter",
        "name_en": "Star Scatter",
        "icon": "⭐",
        "color": "#00E5FF",
        "is_wild": False,
        "is_scatter": True,
    },
    Symbol.SEVEN: {
        "name_vi": "Số 7 Đỏ",
        "name_en": "Lucky Red 7",
        "icon": "7️⃣",
        "color": "#FF1744",
        "is_wild": False,
        "is_scatter": False,
    },
    Symbol.DIAMOND: {
        "name_vi": "Kim Cương",
        "name_en": "Blue Diamond",
        "icon": "💎",
        "color": "#00B0FF",
        "is_wild": False,
        "is_scatter": False,
    },
    Symbol.BELL: {
        "name_vi": "Chuông Vàng",
        "name_en": "Golden Bell",
        "icon": "🔔",
        "color": "#FFD600",
        "is_wild": False,
        "is_scatter": False,
    },
    Symbol.BAR_3: {
        "name_vi": "Triple BAR",
        "name_en": "Triple BAR",
        "icon": "🟩",
        "color": "#00E676",
        "is_wild": False,
        "is_scatter": False,
    },
    Symbol.BAR_2: {
        "name_vi": "Double BAR",
        "name_en": "Double BAR",
        "icon": "🟦",
        "color": "#2979FF",
        "is_wild": False,
        "is_scatter": False,
    },
    Symbol.BAR_1: {
        "name_vi": "Single BAR",
        "name_en": "Single BAR",
        "icon": "🟪",
        "color": "#AA00FF",
        "is_wild": False,
        "is_scatter": False,
    },
    Symbol.WATERMELON: {
        "name_vi": "Dưa Hấu",
        "name_en": "Watermelon",
        "icon": "🍉",
        "color": "#76FF03",
        "is_wild": False,
        "is_scatter": False,
    },
    Symbol.GRAPE: {
        "name_vi": "Chùm Nho",
        "name_en": "Grapes",
        "icon": "🍇",
        "color": "#BA68C8",
        "is_wild": False,
        "is_scatter": False,
    },
    Symbol.PLUM: {
        "name_vi": "Quả Mận",
        "name_en": "Plum",
        "icon": "🫐",
        "color": "#8E24AA",
        "is_wild": False,
        "is_scatter": False,
    },
    Symbol.ORANGE: {
        "name_vi": "Quả Cam",
        "name_en": "Orange",
        "icon": "🍊",
        "color": "#FF9100",
        "is_wild": False,
        "is_scatter": False,
    },
    Symbol.CHERRY: {
        "name_vi": "Trái Cherry",
        "name_en": "Cherry",
        "icon": "🍒",
        "color": "#D50000",
        "is_wild": False,
        "is_scatter": False,
    },
}

# Paytable multipliers applied to BET PER LINE (Left-to-Right starting on reel 1)
PAYTABLE: Dict[Symbol, Dict[int, float]] = {
    Symbol.WILD: {
        5: 2200.0,
        4: 500.0,
        3: 150.0,
        2: 20.0,
    },
    Symbol.SEVEN: {
        5: 1100.0,
        4: 265.0,
        3: 85.0,
    },
    Symbol.DIAMOND: {
        5: 520.0,
        4: 155.0,
        3: 48.0,
    },
    Symbol.BELL: {
        5: 260.0,
        4: 78.0,
        3: 21.0,
    },
    Symbol.BAR_3: {
        5: 200.0,
        4: 60.0,
        3: 20.0,
    },
    Symbol.BAR_2: {
        5: 150.0,
        4: 45.0,
        3: 15.0,
    },
    Symbol.BAR_1: {
        5: 100.0,
        4: 30.0,
        3: 10.0,
    },
    Symbol.WATERMELON: {
        5: 80.0,
        4: 25.0,
        3: 8.0,
    },
    Symbol.GRAPE: {
        5: 70.0,
        4: 20.0,
        3: 7.0,
    },
    Symbol.PLUM: {
        5: 60.0,
        4: 15.0,
        3: 6.0,
    },
    Symbol.ORANGE: {
        5: 50.0,
        4: 12.0,
        3: 5.0,
    },
    Symbol.CHERRY: {
        5: 40.0,
        4: 10.0,
        3: 4.0,
        2: 0.8,
    },
}

# Scatter payout multiplier applied to TOTAL BET (anywhere on reels)
SCATTER_PAYOUT: Dict[int, float] = {
    5: 100.0,
    4: 20.0,
    3: 4.0,
}

# Number of free spins awarded for Scatter counts
FREE_SPINS_AWARDED: Dict[int, int] = {
    5: 20,
    4: 15,
    3: 10,
}

# Win multiplier during Free Spins mode (all payline wins multiplied by this)
FREE_SPINS_WIN_MULTIPLIER = 3.0
