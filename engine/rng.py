"""
RNG (Random Number Generator) for Slot Engine.
Supports standard cryptographic randomness (secrets), fast PRNG (random), or seeded testing.
"""
import random
import secrets
from typing import Optional


class SlotRNG:
    """Random Number Generator designed for slot gaming compliance & testing."""

    def __init__(self, seed: Optional[int] = None, use_crypto: bool = False):
        self.use_crypto = use_crypto
        self.seed = seed
        self._prng = random.Random(seed) if seed is not None else random.Random()

    def get_stop_index(self, strip_length: int) -> int:
        """
        Generate a random stop index uniformly distributed in [0, strip_length - 1].
        """
        if strip_length <= 0:
            raise ValueError("Strip length must be positive")

        if self.use_crypto and self.seed is None:
            return secrets.randbelow(strip_length)
        return self._prng.randrange(strip_length)

    def reseed(self, seed: int):
        """Set seed for deterministic simulation and reproducibility."""
        self.seed = seed
        self._prng.seed(seed)
