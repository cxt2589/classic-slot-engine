"""
Payline patterns for 5x3 classic slot game.
Standard 20 paylines.
Row indices: 0 = Top, 1 = Middle, 2 = Bottom.
"""
from typing import List, Tuple

# 20 standard classic payline configurations
# Each payline has 5 coordinates (one row index per reel column 0..4)
PAYLINES: List[List[int]] = [
    [1, 1, 1, 1, 1],  # Line 1: Hàng giữa thẳng (Middle straight)
    [0, 0, 0, 0, 0],  # Line 2: Hàng trên thẳng (Top straight)
    [2, 2, 2, 2, 2],  # Line 3: Hàng dưới thẳng (Bottom straight)
    [0, 1, 2, 1, 0],  # Line 4: Chữ V xuôi (V-shape)
    [2, 1, 0, 1, 2],  # Line 5: Chữ V ngược (Inverted V)
    [0, 0, 1, 2, 2],  # Line 6: Xuống bậc thang (Step down)
    [2, 2, 1, 0, 0],  # Line 7: Lên bậc thang (Step up)
    [1, 0, 0, 0, 1],  # Line 8: Chõng nón trên (Top trough)
    [1, 2, 2, 2, 1],  # Line 9: Chõng nón dưới (Bottom arch)
    [0, 1, 1, 1, 0],  # Line 10: Vòm nông trên (Shallow top)
    [2, 1, 1, 1, 2],  # Line 11: Vòm nông dưới (Shallow bottom)
    [0, 1, 0, 1, 0],  # Line 12: Zigzag trên (Top zigzag)
    [2, 1, 2, 1, 2],  # Line 13: Zigzag dưới (Bottom zigzag)
    [1, 0, 1, 0, 1],  # Line 14: Lượn sóng tâm 1 (Center wave up)
    [1, 2, 1, 2, 1],  # Line 15: Lượn sóng tâm 2 (Center wave down)
    [1, 1, 0, 1, 1],  # Line 16: Mỏm nhô trên (Top bump)
    [1, 1, 2, 1, 1],  # Line 17: Mỏm nhô dưới (Bottom bump)
    [0, 0, 2, 0, 0],  # Line 18: Thung lũng nhọn (Deep valley)
    [2, 2, 0, 2, 2],  # Line 19: Đỉnh nhọn (High peak)
    [0, 2, 0, 2, 0],  # Line 20: Zigzag góc rộng (Wide zigzag)
]

PAYLINE_COLORS: List[str] = [
    "#FF0055", "#00E5FF", "#FFE600", "#00E676", "#D500F9",
    "#FF6D00", "#2979FF", "#C6FF00", "#FF1744", "#1DE9B6",
    "#F50057", "#00B0FF", "#76FF03", "#651FFF", "#FF9100",
    "#3D5AFE", "#00BFA5", "#FF3D00", "#AEEA00", "#E040FB"
]

def get_paylines(num_lines: int = 20) -> List[List[int]]:
    """Return requested number of paylines (up to 20)."""
    return PAYLINES[:max(1, min(num_lines, len(PAYLINES)))]
