# 🎰 Retro 777 Deluxe - Classic 5x3 Slot Engine & Math Simulator

Hệ thống **Slot Game 5x3 Cổ Điển (Classic Fruit & 777)** chuyên nghiệp bao gồm **Game Math Core**, thuật toán **RNG & Payline Evaluation**, bộ kiểm định xác suất **Monte Carlo Simulator (RTP 95.2%)**, cùng **Backend REST API** và **Giao diện Web Arcade Playable Demo**.

---

## 🌟 1. Điểm Nổi Bật Của Hệ Thống

1. **Chuẩn Mực Toán Học iGaming (GLI-19 Standards)**:
   - Sử dụng **Dải cuộn ảo (Virtual Reel Strips)** gồm 70 vị trí chuẩn mực thay vì chọn ngẫu nhiên độc lập từng ô.
   - Cơ chế sinh số ngẫu nhiên mật mã (**CSPRNG**) chống can thiệp và dự đoán.
   - Tỷ lệ hoàn trả (**Theoretical RTP**): **`95.19%`** (Base Game: 54.60%, Free Spins: 40.59%).
   - Tần suất trúng thưởng (**Hit Frequency**): **`~48.94%`** (~1 lần trúng mỗi 2 vòng quay).
   - Chu kỳ kích hoạt Vòng quay miễn phí: **`1 in 138 spins`**.
   - Độ biến động (**Volatility Index**): **Trung bình (Medium)**, biên độ thắng cao nhất thực nghiệm đạt **`> 420x`**.

2. **Luật Chơi & Cơ Chế Cổ Điển Đầy Đủ**:
   - **Lưới chơi**: 5 cuộn x 3 hàng (5x3 Grid, 15 ô hiển thị).
   - **20 Dòng cược (Paylines)**: Tính từ trái qua phải (Left-to-Right) từ cuộn 1.
   - **Vương Miện Wild (👑)**: Thay thế mọi biểu tượng (ngoại trừ Scatter) cho chuỗi thắng lớn nhất. 5 Wild trên dòng trả thưởng **2,000x**.
   - **Ngôi Sao Scatter (⭐)**: Thưởng trên **Tổng cược (Total Bet)**:
     - 3 Scatter: Thưởng 4x Tổng cược + **10 Vòng Quay Miễn Phí**.
     - 4 Scatter: Thưởng 20x Tổng cược + **15 Vòng Quay Miễn Phí**.
     - 5 Scatter: Thưởng 100x Tổng cược + **20 Vòng Quay Miễn Phí**.
   - **Free Spins Mode**: Mọi chiến thắng theo dòng đều được **nhân 3 giá trị (3X Win Multiplier)** và hỗ trợ Retrigger khi quay ra thêm 3+ Scatter.

3. **Backend REST API & Game Server (FastAPI)**:
   - Server quản lý tiền cược, số dư, logic RNG và lưu lịch sử giao dịch. Client không thể gian lận.
   - Hỗ trợ Swagger API Interactive Docs tại `/docs`.

4. **Web Client Hoàn Chỉnh (HTML5 / Modern CSS / Vanilla JS)**:
   - Giao diện Arcade Retro Las Vegas với hiệu ứng cuộn mượt mà, dừng giật từng cuộn (staggered stop).
   - Hiệu ứng âm thanh cơ học (Web Audio API - không phụ thuộc file ngoài).
   - Vẽ đường nối Paylines thắng trực tiếp trên lưới bằng SVG Overlay.
   - Bảng điều khiển kiểm định Monte Carlo trực quan ngay trên web (chạy 10,000 - 100,000 spins trong vài giây).

---

## 📁 2. Cấu Trúc Thư Mục Dự Án

```
classic-slot-engine/
├── engine/
│   ├── __init__.py         # Package entry & exports
│   ├── symbols.py          # Enum biểu tượng, Metadata, Bảng trả thưởng (Paytable)
│   ├── paylines.py         # Định nghĩa 20 dòng trả thưởng & bảng màu
│   ├── reels.py            # Dải cuộn ảo 70 vị trí cho Base Game & Free Spins
│   ├── rng.py              # Bộ sinh số ngẫu nhiên đồng nhất (SlotRNG)
│   ├── evaluator.py        # Thuật toán quét 20 paylines, Wild substitution & Scatter
│   └── game.py             # Game loop, quản lý PlayerSession, số dư & Free Spins
├── web/
│   ├── index.html          # Giao diện chính máy Slot & Math Dashboard
│   ├── style.css           # Hiệu ứng ánh kim, neon, arcade Vegas cabinet
│   └── app.js              # Controller giao diện, vẽ payline SVG, audio synthesis
├── server.py               # FastAPI backend REST API server
├── simulate.py             # Bộ chạy mô phỏng Monte Carlo độc lập
├── requirements.txt        # Danh sách thư viện Python
└── README.md               # Tài liệu dự án
```

---

## 🚀 3. Hướng Dẫn Cài Đặt & Khởi Chạy

### Khởi động Server & Web Client
```bash
# Di chuyển vào thư mục dự án
cd C:\Users\truon\.gemini\antigravity\scratch\classic-slot-engine

# Kích hoạt virtual environment
.venv\Scripts\activate

# Khởi chạy FastAPI Server
python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

Truy cập trên trình duyệt:
- 🎮 **Chơi Game & Xem Math Dashboard**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- 📚 **Tài liệu API Swagger**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 📊 4. Chạy Kiểm Định Mô Phỏng Xác Suất (Monte Carlo)

Bạn có thể chạy kiểm định hàng trăm nghìn vòng quay bằng lệnh CLI với tốc độ **> 32,000 vòng/giây**:

```bash
# Chạy 100,000 vòng quay kiểm định
.venv\Scripts\python.exe simulate.py 100000

# Hoặc kiểm định 500,000 vòng quay
.venv\Scripts\python.exe simulate.py 500000
```

### Kết Quả Mẫu (200,000 Spins):
```
=======================================================
           MONTE CARLO SIMULATION REPORT         
=======================================================
Total Spins Simulated     : 200,000
Execution Time            : 6.20 s (32,260 spins/sec)
Total RTP                 : 95.19% (Target: 95.0% - 97.0%)
  |-- Base Game RTP       : 54.60%
  `-- Free Spins RTP      : 40.59%
Hit Frequency             : 48.94% (1 win every ~2.0 spins)
Free Spins Trigger Ratio  : 1 in 138
Total Free Spins Played   : 15,735
Max Win Multiplier        : 422.65x
Volatility Index (95% CI) : 12.78 (Standard Dev: 6.52)
=======================================================
```

---

## 🔌 5. Chi Tiết Các API Endpoints

### 1. `POST /api/spin`
Thực hiện 1 lượt quay cược.
- **Request Body**:
```json
{
  "bet_per_line": 1.0,
  "num_lines": 20
}
```
- **Response**: Trả về `grid` (3x5), `stops` (5 vị trí dừng cuộn), `line_wins` (danh sách dòng thắng, tọa độ để vẽ hiệu ứng, số tiền thắng), và `session` (số dư mới, trạng thái Free Spins).

### 2. `GET /api/session`
Lấy thông tin số dư hiện tại, tổng cược, tổng thắng, trạng thái Free Spins và 10 lịch sử cược gần nhất.

### 3. `GET /api/paytable`
Trả về toàn bộ bảng trả thưởng, metadata biểu tượng (icon, tên tiếng Việt, màu sắc) và 20 ma trận paylines.

### 4. `POST /api/simulate`
Chạy mô phỏng N vòng quay (1,000 - 100,000 spins) và trả về kết quả thống kê phân tích RTP trực tiếp cho Dashboard.

### 5. `POST /api/reset`
Nạp lại số dư tài khoản về 10,000 credits để người chơi tiếp tục test.

---

## 📱 6. Kết Nối Với Các Nền Tảng Game Engine Khác

Nếu bạn muốn đóng gói thành Game Mobile Native hoặc Telegram Mini App:
- **Unity (C#)**: Sử dụng `UnityWebRequest` gọi đến `POST /api/spin`, nhận JSON và áp dụng vị trí cuộn cho đối tượng Spine/Sprite 2D.
- **Godot (GDScript)**: Sử dụng `HTTPRequest` node để tương tác với Backend.
- **Cocos Creator / PixiJS (TypeScript)**: Tương thích 100% với REST API có sẵn.
