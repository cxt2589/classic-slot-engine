"""
Virtual Reel Strips for 5x3 Number Slot.
Reels contain numbers 1 through 9.
"""
from typing import List
import random
import secrets

# 5 Reel Strips, each containing 54 numbers (6 repetitions of 1..9 uniformly shuffled)
# We shuffle them in a pseudo-random patterned way to prevent adjacent identical numbers.
_BASE_PATTERN = [
    7, 2, 9, 4, 1, 8, 3, 5, 6,
    8, 1, 6, 3, 9, 2, 7, 4, 5,
    3, 7, 5, 2, 8, 1, 9, 6, 4,
    9, 4, 2, 7, 6, 8, 1, 3, 5,
    5, 8, 3, 1, 4, 9, 6, 7, 2,
    6, 1, 7, 5, 2, 3, 8, 4, 9
]

NUMBER_REEL_STRIPS: List[List[int]] = [
    _BASE_PATTERN,
    _BASE_PATTERN[7:] + _BASE_PATTERN[:7],
    _BASE_PATTERN[19:] + _BASE_PATTERN[:19],
    _BASE_PATTERN[31:] + _BASE_PATTERN[:31],
    _BASE_PATTERN[43:] + _BASE_PATTERN[:43],
]


def get_random_stops(use_crypto: bool = True) -> List[int]:
    """Generate 5 stop indices for the 5 reels."""
    stops = []
    for strip in NUMBER_REEL_STRIPS:
        length = len(strip)
        if use_crypto:
            stops.append(secrets.randbelow(length))
        else:
            stops.append(random.randrange(length))
    return stops


def generate_grid_from_stops(stops: List[int]) -> List[List[int]]:
    """
    Construct 3 rows x 5 columns grid from reel stops.
    Row 0: Top row
    Row 1: Center row (ACTIVE PAYLINE)
    Row 2: Bottom row
    """
    grid = [[0 for _ in range(5)] for _ in range(3)]
    for col in range(5):
        strip = NUMBER_REEL_STRIPS[col]
        length = len(strip)
        stop = stops[col] % length
        grid[0][col] = strip[stop]
        grid[1][col] = strip[(stop + 1) % length]
        grid[2][col] = strip[(stop + 2) % length]
    return grid
