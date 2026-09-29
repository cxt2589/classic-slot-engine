"""
Reel strips configuration and grid generation for 5x3 Retro Classic Slot.
Engineered for ~96.0% - 96.5% RTP with classic 20 Paylines and Free Spins feature.
"""
from typing import List
from engine.symbols import Symbol
from engine.rng import SlotRNG

# Base Game Reel Strips (Reels 1 through 5)
BASE_REEL_STRIPS: List[List[Symbol]] = [
    # Reel 1 (70 positions)
    [
        Symbol.SEVEN, Symbol.CHERRY, Symbol.ORANGE, Symbol.BELL, Symbol.PLUM,
        Symbol.WATERMELON, Symbol.BAR_1, Symbol.CHERRY, Symbol.WILD, Symbol.GRAPE,
        Symbol.BAR_2, Symbol.SCATTER, Symbol.CHERRY, Symbol.PLUM, Symbol.BELL,
        Symbol.ORANGE, Symbol.DIAMOND, Symbol.WATERMELON, Symbol.CHERRY, Symbol.BAR_3,
        Symbol.GRAPE, Symbol.ORANGE, Symbol.BELL, Symbol.CHERRY, Symbol.PLUM,
        Symbol.WATERMELON, Symbol.SEVEN, Symbol.BAR_1, Symbol.ORANGE, Symbol.GRAPE,
        Symbol.CHERRY, Symbol.BAR_2, Symbol.PLUM, Symbol.BELL, Symbol.ORANGE,
        Symbol.DIAMOND, Symbol.WATERMELON, Symbol.CHERRY, Symbol.GRAPE, Symbol.BAR_3,
        Symbol.ORANGE, Symbol.SEVEN, Symbol.BELL, Symbol.CHERRY, Symbol.WILD,
        Symbol.WATERMELON, Symbol.BAR_1, Symbol.ORANGE, Symbol.GRAPE, Symbol.SCATTER,
        Symbol.CHERRY, Symbol.PLUM, Symbol.BAR_2, Symbol.ORANGE, Symbol.DIAMOND,
        Symbol.BELL, Symbol.WATERMELON, Symbol.CHERRY, Symbol.GRAPE, Symbol.ORANGE,
        Symbol.SEVEN, Symbol.BELL, Symbol.BAR_1, Symbol.CHERRY, Symbol.ORANGE,
        Symbol.WATERMELON, Symbol.BELL, Symbol.GRAPE, Symbol.CHERRY, Symbol.SCATTER
    ],
    # Reel 2 (70 positions)
    [
        Symbol.CHERRY, Symbol.WILD, Symbol.ORANGE, Symbol.BAR_1, Symbol.PLUM,
        Symbol.WATERMELON, Symbol.BELL, Symbol.CHERRY, Symbol.GRAPE, Symbol.BAR_2,
        Symbol.SCATTER, Symbol.ORANGE, Symbol.SEVEN, Symbol.PLUM, Symbol.CHERRY,
        Symbol.DIAMOND, Symbol.BAR_3, Symbol.WATERMELON, Symbol.ORANGE, Symbol.BELL,
        Symbol.GRAPE, Symbol.CHERRY, Symbol.WILD, Symbol.PLUM, Symbol.BAR_1,
        Symbol.ORANGE, Symbol.WATERMELON, Symbol.CHERRY, Symbol.GRAPE, Symbol.BAR_2,
        Symbol.BELL, Symbol.ORANGE, Symbol.PLUM, Symbol.SEVEN, Symbol.CHERRY,
        Symbol.DIAMOND, Symbol.WATERMELON, Symbol.BAR_3, Symbol.ORANGE, Symbol.GRAPE,
        Symbol.BELL, Symbol.CHERRY, Symbol.WILD, Symbol.PLUM, Symbol.BAR_1,
        Symbol.ORANGE, Symbol.SCATTER, Symbol.WATERMELON, Symbol.CHERRY, Symbol.GRAPE,
        Symbol.BAR_2, Symbol.BELL, Symbol.ORANGE, Symbol.PLUM, Symbol.SEVEN,
        Symbol.CHERRY, Symbol.DIAMOND, Symbol.WATERMELON, Symbol.BAR_3, Symbol.ORANGE,
        Symbol.GRAPE, Symbol.BELL, Symbol.CHERRY, Symbol.WILD, Symbol.PLUM,
        Symbol.BAR_1, Symbol.ORANGE, Symbol.WATERMELON, Symbol.CHERRY, Symbol.GRAPE
    ],
    # Reel 3 (70 positions)
    [
        Symbol.ORANGE, Symbol.WILD, Symbol.CHERRY, Symbol.BELL, Symbol.GRAPE,
        Symbol.BAR_1, Symbol.PLUM, Symbol.WATERMELON, Symbol.ORANGE, Symbol.SEVEN,
        Symbol.CHERRY, Symbol.SCATTER, Symbol.BAR_2, Symbol.GRAPE, Symbol.BELL,
        Symbol.DIAMOND, Symbol.PLUM, Symbol.ORANGE, Symbol.BAR_3, Symbol.WATERMELON,
        Symbol.CHERRY, Symbol.WILD, Symbol.GRAPE, Symbol.BELL, Symbol.ORANGE,
        Symbol.BAR_1, Symbol.PLUM, Symbol.CHERRY, Symbol.WATERMELON, Symbol.GRAPE,
        Symbol.BAR_2, Symbol.ORANGE, Symbol.SEVEN, Symbol.CHERRY, Symbol.BELL,
        Symbol.PLUM, Symbol.DIAMOND, Symbol.ORANGE, Symbol.BAR_3, Symbol.WATERMELON,
        Symbol.CHERRY, Symbol.WILD, Symbol.GRAPE, Symbol.BELL, Symbol.ORANGE,
        Symbol.BAR_1, Symbol.PLUM, Symbol.SCATTER, Symbol.CHERRY, Symbol.WATERMELON,
        Symbol.GRAPE, Symbol.BAR_2, Symbol.ORANGE, Symbol.BELL, Symbol.CHERRY,
        Symbol.SEVEN, Symbol.PLUM, Symbol.DIAMOND, Symbol.ORANGE, Symbol.BAR_3,
        Symbol.WATERMELON, Symbol.CHERRY, Symbol.WILD, Symbol.GRAPE, Symbol.BELL,
        Symbol.ORANGE, Symbol.BAR_1, Symbol.PLUM, Symbol.CHERRY, Symbol.WATERMELON
    ],
    # Reel 4 (70 positions)
    [
        Symbol.PLUM, Symbol.WILD, Symbol.ORANGE, Symbol.BAR_1, Symbol.CHERRY,
        Symbol.BELL, Symbol.WATERMELON, Symbol.GRAPE, Symbol.ORANGE, Symbol.BAR_2,
        Symbol.SCATTER, Symbol.PLUM, Symbol.SEVEN, Symbol.CHERRY, Symbol.DIAMOND,
        Symbol.BELL, Symbol.ORANGE, Symbol.BAR_3, Symbol.WATERMELON, Symbol.GRAPE,
        Symbol.PLUM, Symbol.WILD, Symbol.CHERRY, Symbol.BAR_1, Symbol.ORANGE,
        Symbol.BELL, Symbol.WATERMELON, Symbol.GRAPE, Symbol.PLUM, Symbol.BAR_2,
        Symbol.ORANGE, Symbol.CHERRY, Symbol.SEVEN, Symbol.BELL, Symbol.DIAMOND,
        Symbol.PLUM, Symbol.BAR_3, Symbol.ORANGE, Symbol.WATERMELON, Symbol.GRAPE,
        Symbol.CHERRY, Symbol.WILD, Symbol.BELL, Symbol.PLUM, Symbol.BAR_1,
        Symbol.ORANGE, Symbol.SCATTER, Symbol.CHERRY, Symbol.WATERMELON, Symbol.GRAPE,
        Symbol.PLUM, Symbol.BAR_2, Symbol.BELL, Symbol.ORANGE, Symbol.CHERRY,
        Symbol.SEVEN, Symbol.DIAMOND, Symbol.PLUM, Symbol.BAR_3, Symbol.ORANGE,
        Symbol.WATERMELON, Symbol.GRAPE, Symbol.CHERRY, Symbol.WILD, Symbol.BELL,
        Symbol.PLUM, Symbol.BAR_1, Symbol.ORANGE, Symbol.CHERRY, Symbol.WATERMELON
    ],
    # Reel 5 (70 positions)
    [
        Symbol.GRAPE, Symbol.ORANGE, Symbol.CHERRY, Symbol.BAR_1, Symbol.BELL,
        Symbol.PLUM, Symbol.WATERMELON, Symbol.SEVEN, Symbol.GRAPE, Symbol.BAR_2,
        Symbol.SCATTER, Symbol.ORANGE, Symbol.CHERRY, Symbol.BELL, Symbol.DIAMOND,
        Symbol.PLUM, Symbol.BAR_3, Symbol.WATERMELON, Symbol.GRAPE, Symbol.ORANGE,
        Symbol.CHERRY, Symbol.BAR_1, Symbol.BELL, Symbol.PLUM, Symbol.WATERMELON,
        Symbol.GRAPE, Symbol.SEVEN, Symbol.ORANGE, Symbol.BAR_2, Symbol.CHERRY,
        Symbol.BELL, Symbol.DIAMOND, Symbol.PLUM, Symbol.WATERMELON, Symbol.BAR_3,
        Symbol.GRAPE, Symbol.ORANGE, Symbol.CHERRY, Symbol.BAR_1, Symbol.BELL,
        Symbol.PLUM, Symbol.WATERMELON, Symbol.SCATTER, Symbol.GRAPE, Symbol.SEVEN,
        Symbol.ORANGE, Symbol.BAR_2, Symbol.CHERRY, Symbol.BELL, Symbol.DIAMOND,
        Symbol.PLUM, Symbol.WATERMELON, Symbol.BAR_3, Symbol.GRAPE, Symbol.ORANGE,
        Symbol.CHERRY, Symbol.BAR_1, Symbol.BELL, Symbol.PLUM, Symbol.WATERMELON,
        Symbol.GRAPE, Symbol.ORANGE, Symbol.CHERRY, Symbol.BAR_2, Symbol.BELL,
        Symbol.WILD, Symbol.PLUM, Symbol.WATERMELON, Symbol.CHERRY, Symbol.ORANGE
    ]
]

# Free Spins Reel Strips
FREE_SPINS_REEL_STRIPS: List[List[Symbol]] = [
    BASE_REEL_STRIPS[0],
    [Symbol.WILD if s in (Symbol.BAR_1, Symbol.BAR_2) else s for s in BASE_REEL_STRIPS[1]],
    [Symbol.WILD if s in (Symbol.BAR_1, Symbol.BAR_2) else s for s in BASE_REEL_STRIPS[2]],
    [Symbol.WILD if s in (Symbol.BAR_1, Symbol.BAR_2) else s for s in BASE_REEL_STRIPS[3]],
    BASE_REEL_STRIPS[4]
]


def generate_grid_from_stops(stops: List[int], is_free_spins: bool = False) -> List[List[Symbol]]:
    strips = FREE_SPINS_REEL_STRIPS if is_free_spins else BASE_REEL_STRIPS
    grid = [[Symbol.CHERRY for _ in range(5)] for _ in range(3)]

    for col in range(5):
        strip = strips[col]
        strip_len = len(strip)
        stop = stops[col] % strip_len
        grid[0][col] = strip[stop]
        grid[1][col] = strip[(stop + 1) % strip_len]
        grid[2][col] = strip[(stop + 2) % strip_len]

    return grid


def get_random_stops(rng: SlotRNG, is_free_spins: bool = False) -> List[int]:
    strips = FREE_SPINS_REEL_STRIPS if is_free_spins else BASE_REEL_STRIPS
    return [rng.get_stop_index(len(strip)) for strip in strips]
