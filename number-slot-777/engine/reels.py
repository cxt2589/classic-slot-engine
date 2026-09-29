"""
Virtual Reel Strips for 5x3 Number Slot.
Reels contain numbers 1 through 9 strictly ordered in cyclic sequence.
"""
from typing import List
import random
import secrets

# 5 Reel Strips, each containing numbers 1..9 strictly ordered in cyclic sequence.
NUMBER_REEL_STRIPS: List[List[int]] = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9] for _ in range(5)
]


def get_random_stops(use_crypto: bool = True) -> List[int]:
    """Generate 5 stop indices (0..8) for the 5 reels, determining center row numbers."""
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
    Row 0: Top row (Center - 1 cyclically)
    Row 1: Center row (ACTIVE PAYLINE, value = stop + 1)
    Row 2: Bottom row (Center + 1 cyclically)
    Every column displays strictly ordered numbers in sequence 1-9 without duplicates.
    """
    grid = [[0 for _ in range(5)] for _ in range(3)]
    for col in range(5):
        strip = NUMBER_REEL_STRIPS[col]
        length = len(strip)
        stop = stops[col] % length
        # stop is the center row index
        grid[0][col] = strip[(stop - 1 + length) % length]
        grid[1][col] = strip[stop]
        grid[2][col] = strip[(stop + 1) % length]
    return grid
