# 🎰 Lucky Numbers 777 - Classic 5x3 Number Slot Machine

Dòng game **Slot Số Cổ Điển (Classic Number Slot)** 5 cuộn x 3 hàng với **Dòng trả thưởng duy nhất ở hàng giữa (Center Payline - Row 1)**, cho phép người chơi đặt cược theo số và các tổ hợp phong cách Tài Xỉu, Poker:
- **Tài / Xỉu (Tổng 5 số hàng giữa: Tài 26-45, Xỉu 5-24, Hòa 25)**
- **Chẵn / Lẻ (Tổng chẵn hoặc lẻ)**
- **Thùng (Toàn Chẵn hoặc Toàn Lẻ)**
- **Sảnh (5 số liên tiếp, Sảnh chuẩn 1-2-3-4-5)**
- **Tổ hợp Poker (Ngũ Quý, Tứ Quý, Cù Lũ, Sám, Hai Đôi, Đôi)**
- **Cược con số yêu thích (1, 2, 3 ... 9 xuất hiện trên hàng giữa)**
- **Cược quay Slot tự động (Base Slot Spin)**

---

## 🚀 Khởi chạy cục bộ (FastAPI)

```bash
cd C:\Users\truon\.gemini\antigravity\scratch\number-slot-engine
.venv\Scripts\python.exe -m uvicorn server:app --host 127.0.0.1 --port 8001 --reload
```

Truy cập:
- Game & Bàn Cược: http://127.0.0.1:8001
- API Swagger Docs: http://127.0.0.1:8001/docs

---

## ⚡ Triển khai lên Cloudflare Pages (100% Serverless)

Dự án đã được tích hợp sẵn `web/_worker.js` để chạy hoàn toàn Serverless trên biên mạng toàn cầu của Cloudflare:

```bash
npx wrangler pages project create lucky-numbers-777 --production-branch main --force
npx wrangler pages deploy web --project-name lucky-numbers-777
```

Link công khai: `https://lucky-numbers-777.pages.dev`
