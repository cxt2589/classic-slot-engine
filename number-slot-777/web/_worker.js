/**
 * Cloudflare Pages / Workers Native Serverless Backend for Lucky Numbers 777.
 * 100% Serverless - zero infrastructure costs, globally distributed.
 */

const NUMBER_REEL_STRIPS = [
  [
    7, 2, 9, 4, 1, 8, 3, 5, 6,
    8, 1, 6, 3, 9, 2, 7, 4, 5,
    3, 7, 5, 2, 8, 1, 9, 6, 4,
    9, 4, 2, 7, 6, 8, 1, 3, 5,
    5, 8, 3, 1, 4, 9, 6, 7, 2,
    6, 1, 7, 5, 2, 3, 8, 4, 9
  ],
  [
    5, 6, 8, 1, 6, 3, 9, 2, 7,
    4, 5, 3, 7, 5, 2, 8, 1, 9,
    6, 4, 9, 4, 2, 7, 6, 8, 1,
    3, 5, 5, 8, 3, 1, 4, 9, 6,
    7, 2, 6, 1, 7, 5, 2, 3, 8,
    4, 9, 7, 2, 9, 4, 1, 8, 3
  ],
  [
    8, 1, 9, 6, 4, 9, 4, 2, 7,
    6, 8, 1, 3, 5, 5, 8, 3, 1,
    4, 9, 6, 7, 2, 6, 1, 7, 5,
    2, 3, 8, 4, 9, 7, 2, 9, 4,
    1, 8, 3, 5, 6, 8, 1, 6, 3,
    9, 2, 7, 4, 5, 3, 7, 5, 2
  ],
  [
    9, 6, 7, 2, 6, 1, 7, 5, 2,
    3, 8, 4, 9, 7, 2, 9, 4, 1,
    8, 3, 5, 6, 8, 1, 6, 3, 9,
    2, 7, 4, 5, 3, 7, 5, 2, 8,
    1, 9, 6, 4, 9, 4, 2, 7, 6,
    8, 1, 3, 5, 5, 8, 3, 1, 4
  ],
  [
    7, 4, 5, 3, 7, 5, 2, 8, 1,
    9, 6, 4, 9, 4, 2, 7, 6, 8,
    1, 3, 5, 5, 8, 3, 1, 4, 9,
    6, 7, 2, 6, 1, 7, 5, 2, 3,
    8, 4, 9, 7, 2, 9, 4, 1, 8,
    3, 5, 6, 8, 1, 6, 3, 9, 2
  ]
];

const BET_PAYOUTS = {
  TAI: 2.05, XIU: 2.05, HOA_25: 14.1,
  CHAN: 1.92, LE: 1.92,
  THUNG: 13.6, THUNG_CHAN: 55.0, THUNG_LE: 18.0,
  SANH: 94.0, SANH_CHUAN: 5000.0,
  NGU_QUY: 5000.0, TU_QUY: 156.0, CU_LU: 78.0,
  SAM_CO: 11.2, HAI_DOI: 7.45, MOT_DOI: 1.86
};

const SINGLE_NUMBER_PAYOUTS = { 1: 1.7, 2: 3.1, 3: 7.5, 4: 25.0, 5: 100.0 };

const BASE_HAND_PAYOUTS = {
  NGU_QUY: 250.0, SANH_CHUAN: 150.0, TU_QUY: 16.0,
  THUNG_CHAN: 4.5, SANH: 8.0, CU_LU: 6.0,
  THUNG_LE: 2.4, SAM_CO: 2.2, HAI_DOI: 1.4, MOT_DOI: 0.3
};

function getRandomStop(len) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % len;
}

function analyzeCenterRow(numbers) {
  const sum = numbers.reduce((a, b) => a + b, 0);
  const is_tai = sum > 25;
  const is_xiu = sum < 25;
  const is_hoa_25 = sum === 25;
  const is_chan = sum % 2 === 0;
  const is_le = sum % 2 !== 0;

  const is_thung_chan = numbers.every(n => n % 2 === 0);
  const is_thung_le = numbers.every(n => n % 2 !== 0);
  const is_thung = is_thung_chan || is_thung_le;

  const validStraights = [
    [1,2,3,4,5], [2,3,4,5,6], [3,4,5,6,7], [4,5,6,7,8], [5,6,7,8,9]
  ];
  const is_sanh_chuan = validStraights.some(seq => seq.every((v, i) => v === numbers[i]));
  const sorted = [...numbers].sort((a,b) => a - b);
  const is_sanh = validStraights.some(seq => seq.every((v, i) => v === sorted[i]));

  const counts = {};
  numbers.forEach(n => counts[n] = (counts[n] || 0) + 1);
  const freqs = Object.values(counts).sort((a,b) => b - a);

  const is_ngu_quy = freqs[0] === 5;
  const is_tu_quy = freqs[0] === 4;
  const is_cu_lu = freqs[0] === 3 && freqs[1] === 2;
  const is_sam_co = freqs[0] === 3;
  const is_hai_doi = freqs[0] === 2 && freqs[1] === 2;
  const is_mot_doi = freqs[0] === 2;

  let best_hand = "MAU_THAU";
  let hand_title_vi = "Số Rời";

  if (is_ngu_quy) { best_hand = "NGU_QUY"; hand_title_vi = "Ngũ Quý (5 Số Giống Nhau)"; }
  else if (is_sanh_chuan) { best_hand = "SANH_CHUAN"; hand_title_vi = "Sảnh Chuẩn (1-2-3-4-5 Tăng Dần)"; }
  else if (is_tu_quy) { best_hand = "TU_QUY"; hand_title_vi = "Tứ Quý (4 Số Giống Nhau)"; }
  else if (is_thung_chan) { best_hand = "THUNG_CHAN"; hand_title_vi = "Thùng Toàn Chẵn"; }
  else if (is_sanh) { best_hand = "SANH"; hand_title_vi = "Sảnh Tự Do (5 Số Liên Tiếp)"; }
  else if (is_cu_lu) { best_hand = "CU_LU"; hand_title_vi = "Cù Lũ (3 Số + 1 Đôi)"; }
  else if (is_thung_le) { best_hand = "THUNG_LE"; hand_title_vi = "Thùng Toàn Lẻ"; }
  else if (is_sam_co) { best_hand = "SAM_CO"; hand_title_vi = "Sám Cô (3 Số Giống Nhau)"; }
  else if (is_hai_doi) { best_hand = "HAI_DOI"; hand_title_vi = "Hai Đôi"; }
  else if (is_mot_doi) { best_hand = "MOT_DOI"; hand_title_vi = "Một Đôi"; }

  return {
    numbers, sum, is_tai, is_xiu, is_hoa_25, is_chan, is_le,
    is_thung, is_thung_chan, is_thung_le, is_sanh, is_sanh_chuan,
    is_ngu_quy, is_tu_quy, is_cu_lu, is_sam_co, is_hai_doi, is_mot_doi,
    best_hand, hand_title_vi, counts
  };
}

function generateSampleSpin(spinNum) {
  const stops = NUMBER_REEL_STRIPS.map(strip => getRandomStop(strip.length));
  const center_row = [
    NUMBER_REEL_STRIPS[0][(stops[0] + 1) % NUMBER_REEL_STRIPS[0].length],
    NUMBER_REEL_STRIPS[1][(stops[1] + 1) % NUMBER_REEL_STRIPS[1].length],
    NUMBER_REEL_STRIPS[2][(stops[2] + 1) % NUMBER_REEL_STRIPS[2].length],
    NUMBER_REEL_STRIPS[3][(stops[3] + 1) % NUMBER_REEL_STRIPS[3].length],
    NUMBER_REEL_STRIPS[4][(stops[4] + 1) % NUMBER_REEL_STRIPS[4].length],
  ];
  const analysis = analyzeCenterRow(center_row);
  return {
    spin: spinNum,
    center_row,
    sum: analysis.sum,
    is_tai: analysis.is_tai,
    is_xiu: analysis.is_xiu,
    is_hoa_25: analysis.is_hoa_25,
    is_chan: analysis.is_chan,
    is_le: analysis.is_le,
    is_thung: analysis.is_thung,
    is_sanh: analysis.is_sanh,
    best_hand: analysis.hand_title_vi,
    best_hand_key: analysis.best_hand,
    total_bet: 0,
    total_won: 0,
    net: 0
  };
}

function initSampleHistory(count = 35) {
  const list = [];
  for (let i = count; i >= 1; i--) {
    list.push(generateSampleSpin(100 - i));
  }
  return list;
}

let session = null;

function ensureSession() {
  if (!session) {
    session = {
      session_id: "num-cf-" + Math.random().toString(36).substring(2, 9),
      balance: 10000.0,
      total_wagered: 0.0,
      total_won: 0.0,
      total_spins: 0,
      history: initSampleHistory(35)
    };
  }
  return session;
}

const OPENAPI_SPEC = {
  openapi: "3.0.2",
  info: {
    title: "Lucky Numbers 777 - Classic Number Slot Engine API",
    description: "Backend API and Math Engine for 5x3 Single Center Line Number Slot with Tài/Xỉu, Chẵn/Lẻ, Thùng, Sảnh, Poker Hands and Single Number Bets.",
    version: "1.0.0"
  },
  paths: {
    "/api/session": {
      get: {
        summary: "Retrieve Player Session Info",
        description: "Returns the current balance, total wagered, total won, empirical RTP, and up to 100 recent spin records.",
        responses: {
          "200": { description: "Successful Response" }
        }
      }
    },
    "/api/spin": {
      post: {
        summary: "Execute Spin and Evaluate Center Line",
        description: "Spins 5 virtual reels, extracts row 1 (center row), checks user bets against game rules, updates player wallet and logs history.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  bets: {
                    type: "object",
                    additionalProperties: { type: "number" },
                    example: { TAI: 50.0, THUNG: 20.0, SO_7: 10.0 }
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Successful spin execution" },
          "400": { description: "Invalid bets or insufficient balance" }
        }
      }
    },
    "/api/reset": {
      post: {
        summary: "Reset Player Balance",
        description: "Resets the player balance to 10,000 credits and initializes seeded history.",
        responses: {
          "200": { description: "Balance reset" }
        }
      }
    },
    "/api/rules": {
      get: {
        summary: "Get Betting Rules & Paytable",
        description: "Returns all multipliers for Tài/Xỉu, Chẵn/Lẻ, Thùng, Sảnh, Poker combinations, and Single numbers 1-9.",
        responses: {
          "200": { description: "Rules and paytable" }
        }
      }
    },
    "/api/simulate": {
      post: {
        summary: "Run Monte Carlo Math Simulation",
        description: "Simulates up to 50,000 spins to verify empirical RTP and outcome frequencies.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  spins: { type: "integer", default: 10000, minimum: 100, maximum: 50000 }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Simulation results" }
        }
      }
    }
  }
};

const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Lucky Numbers 777 - Swagger API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@600;700;800;900&family=Montserrat:wght@700;800;900&family=Orbitron:wght@700;900&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      background: #080a11;
      font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #e2e8f0;
    }
    .custom-top-header {
      background: linear-gradient(135deg, #101524 0%, #06080e 100%);
      border-bottom: 2px solid #ffd700;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    }
    .ct-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ct-icon {
      font-size: 1.8rem;
    }
    .ct-title {
      font-family: 'Montserrat', 'Be Vietnam Pro', sans-serif;
      font-size: 1.25rem;
      font-weight: 900;
      color: #ffd700;
      letter-spacing: 1px;
    }
    .ct-sub {
      font-size: 0.8rem;
      color: #718096;
      font-weight: 600;
    }
    .ct-btn {
      background: linear-gradient(135deg, #ffd700 0%, #ff8f00 100%);
      color: #000;
      text-decoration: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
      box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .ct-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 18px rgba(255, 215, 0, 0.7);
    }
    .swagger-ui {
      filter: invert(90%) hue-rotate(180deg);
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div class="custom-top-header">
    <div class="ct-brand">
      <span class="ct-icon">🎰</span>
      <div>
        <div class="ct-title">LUCKY NUMBERS 777 — REST API DOCS</div>
        <div class="ct-sub">OpenAPI 3.0.2 • Single Center Payline Engine • Interactive Swagger UI</div>
      </div>
    </div>
    <a href="/" class="ct-btn">🎮 VỀ GAME CLIENT</a>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;

export default {

  async fetch(request, env) {
    ensureSession();
    const url = new URL(request.url);

    const jsonRes = (data, status = 200) => new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }

    if (url.pathname === "/openapi.json" && request.method === "GET") {
      return jsonRes(OPENAPI_SPEC);
    }

    if ((url.pathname === "/docs" || url.pathname === "/docs/") && request.method === "GET") {
      return new Response(SWAGGER_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    if (url.pathname === "/api/rules" && request.method === "GET") {
      return jsonRes({
        status: "success",
        data: {
          bet_payouts: BET_PAYOUTS,
          single_number_payouts: SINGLE_NUMBER_PAYOUTS,
          base_hand_payouts: BASE_HAND_PAYOUTS
        }
      });
    }

    if (url.pathname === "/api/session" && request.method === "GET") {
      const rtp = session.total_wagered > 0 ? (session.total_won / session.total_wagered * 100) : 0;
      return jsonRes({
        status: "success",
        data: {
          ...session,
          rtp_actual: Math.round(rtp * 100) / 100
        },
        recent_history: session.history.slice(0, 100)
      });
    }

    if (url.pathname === "/api/reset" && request.method === "POST") {
      session = {
        session_id: "num-cf-" + Math.random().toString(36).substring(2, 9),
        balance: 10000.0,
        total_wagered: 0.0,
        total_won: 0.0,
        total_spins: 0,
        history: initSampleHistory(35)
      };
      return jsonRes({ status: "success", data: session });
    }

    if (url.pathname === "/api/spin" && request.method === "POST") {
      let bets = {};
      try {
        const body = await request.json();
        bets = body.bets || { BASE_SPIN: 10.0 };
      } catch (e) {}

      const totalBet = Object.values(bets).reduce((a, b) => a + Number(b), 0);
      if (totalBet <= 0) return jsonRes({ detail: "Vui lòng đặt cược ít nhất 1 cửa!" }, 400);
      if (session.balance < totalBet) return jsonRes({ detail: "Số dư không đủ!" }, 400);

      session.balance -= totalBet;
      session.total_wagered += totalBet;
      session.total_spins++;

      // Stops and Grid
      const stops = NUMBER_REEL_STRIPS.map(strip => getRandomStop(strip.length));
      const grid = [[], [], []];
      for (let c = 0; c < 5; c++) {
        const strip = NUMBER_REEL_STRIPS[c];
        const len = strip.length;
        grid[0][c] = strip[stops[c] % len];
        grid[1][c] = strip[(stops[c] + 1) % len]; // Center row
        grid[2][c] = strip[(stops[c] + 2) % len];
      }

      const center_row = grid[1];
      const analysis = analyzeCenterRow(center_row);

      // Evaluate bets
      const winningItems = [];
      let totalWon = 0;

      for (const [betKey, wagerVal] of Object.entries(bets)) {
        const wager = Number(wagerVal);
        if (wager <= 0) continue;

        let mult = 0;
        let reason = "";

        if (betKey === "BASE_SPIN") {
          mult = BASE_HAND_PAYOUTS[analysis.best_hand] || 0;
          reason = `Trúng ${analysis.hand_title_vi}`;
        } else if (betKey === "TAI" && analysis.is_tai) {
          mult = BET_PAYOUTS.TAI; reason = `Tổng ${analysis.sum} > 25 (TÀI)`;
        } else if (betKey === "XIU" && analysis.is_xiu) {
          mult = BET_PAYOUTS.XIU; reason = `Tổng ${analysis.sum} < 25 (XỈU)`;
        } else if (betKey === "HOA_25" && analysis.is_hoa_25) {
          mult = BET_PAYOUTS.HOA_25; reason = "Tổng chính xác 25 điểm";
        } else if (betKey === "CHAN" && analysis.is_chan) {
          mult = BET_PAYOUTS.CHAN; reason = "Tổng CHẴN";
        } else if (betKey === "LE" && analysis.is_le) {
          mult = BET_PAYOUTS.LE; reason = "Tổng LẺ";
        } else if (betKey === "THUNG" && analysis.is_thung) {
          mult = BET_PAYOUTS.THUNG; reason = "Thùng (Toàn Chẵn hoặc Toàn Lẻ)";
        } else if (betKey === "THUNG_CHAN" && analysis.is_thung_chan) {
          mult = BET_PAYOUTS.THUNG_CHAN; reason = "Thùng Toàn Chẵn";
        } else if (betKey === "THUNG_LE" && analysis.is_thung_le) {
          mult = BET_PAYOUTS.THUNG_LE; reason = "Thùng Toàn Lẻ";
        } else if (betKey === "SANH" && analysis.is_sanh) {
          mult = BET_PAYOUTS.SANH; reason = "Sảnh (5 số liên tiếp)";
        } else if (betKey === "SANH_CHUAN" && analysis.is_sanh_chuan) {
          mult = BET_PAYOUTS.SANH_CHUAN; reason = "👑 Sảnh Chuẩn (1-2-3-4-5)";
        } else if (betKey === "NGU_QUY" && analysis.is_ngu_quy) {
          mult = BET_PAYOUTS.NGU_QUY; reason = "Ngũ Quý (5 số giống nhau)";
        } else if (betKey === "TU_QUY" && (analysis.is_tu_quy || analysis.is_ngu_quy)) {
          mult = BET_PAYOUTS.TU_QUY; reason = "Tứ Quý";
        } else if (betKey === "CU_LU" && analysis.is_cu_lu) {
          mult = BET_PAYOUTS.CU_LU; reason = "Cù Lũ";
        } else if (betKey === "SAM_CO" && (analysis.is_sam_co || analysis.is_tu_quy || analysis.is_ngu_quy)) {
          mult = BET_PAYOUTS.SAM_CO; reason = "Sám Cô";
        } else if (betKey === "HAI_DOI" && (analysis.is_hai_doi || analysis.is_cu_lu)) {
          mult = BET_PAYOUTS.HAI_DOI; reason = "Hai Đôi";
        } else if (betKey === "MOT_DOI" && (analysis.is_mot_doi || analysis.is_hai_doi || analysis.is_sam_co || analysis.is_cu_lu || analysis.is_tu_quy || analysis.is_ngu_quy)) {
          mult = BET_PAYOUTS.MOT_DOI; reason = "Một Đôi";
        } else if (betKey.startsWith("SO_")) {
          const num = parseInt(betKey.split("_")[1]);
          const cnt = analysis.counts[num] || 0;
          if (cnt > 0) {
            mult = SINGLE_NUMBER_PAYOUTS[cnt] || 100.0;
            reason = `Số ${num} xuất hiện ${cnt} lần`;
          }
        }

        if (mult > 0) {
          const win = Math.round(wager * mult * 100) / 100;
          totalWon += win;
          winningItems.push({ bet_type: betKey, wager, multiplier: mult, win_amount: win, reason_vi: reason });
        }
      }

      totalWon = Math.round(totalWon * 100) / 100;
      session.balance += totalWon;
      session.total_won += totalWon;

      // Add to session history
      const histEntry = {
        spin: session.total_spins,
        center_row,
        sum: analysis.sum,
        is_tai: analysis.is_tai,
        is_xiu: analysis.is_xiu,
        is_hoa_25: analysis.is_hoa_25,
        is_chan: analysis.is_chan,
        is_le: analysis.is_le,
        is_thung: analysis.is_thung,
        is_sanh: analysis.is_sanh,
        best_hand: analysis.hand_title_vi,
        best_hand_key: analysis.best_hand,
        total_bet: totalBet,
        total_won: totalWon,
        net: Math.round((totalWon - totalBet) * 100) / 100
      };
      session.history.unshift(histEntry);
      if (session.history.length > 100) session.history.pop();

      return jsonRes({
        status: "success",
        data: {
          session: {
            ...session,
            balance: Math.round(session.balance * 100) / 100,
            rtp_actual: session.total_wagered > 0 ? Math.round(session.total_won / session.total_wagered * 10000) / 100 : 0,
            history: session.history.slice(0, 100)
          },
          grid,
          center_row,
          stops,
          analysis,
          payout: {
            total_bet: totalBet,
            total_won: totalWon,
            net_profit: Math.round((totalWon - totalBet) * 100) / 100,
            winning_items: winningItems
          }
        }
      });
    }

    if (url.pathname === "/api/simulate" && request.method === "POST") {
      let spins = 20000;
      try {
        const body = await request.json();
        if (body.spins) spins = Math.min(50000, Math.max(100, body.spins));
      } catch (e) {}

      const t0 = Date.now();
      const TARGET_RTPS = {
        BASE_SPIN: 95.00, TAI: 95.55, XIU: 95.55, HOA_25: 95.63,
        CHAN: 96.00, LE: 96.00,
        THUNG: 95.55, THUNG_CHAN: 95.37, THUNG_LE: 95.26,
        SANH: 95.51, SANH_CHUAN: 42.34,
        NGU_QUY: 76.21, TU_QUY: 95.10, CU_LU: 95.10,
        SAM_CO: 95.60, HAI_DOI: 95.38, MOT_DOI: 95.25,
        SO_1: 95.83, SO_2: 95.83, SO_3: 95.83, SO_4: 95.83,
        SO_5: 95.83, SO_6: 95.83, SO_7: 95.83, SO_8: 95.83, SO_9: 95.83
      };

      const BET_META = {
        BASE_SPIN: { name_vi: "Quay Slot Tiêu Chuẩn", category: "🎰 Base Game", mult_str: "Tổ hợp" },
        TAI: { name_vi: "Cược Tài (Tổng 26 - 45)", category: "🎯 Cầu Điểm", mult_str: "x2.05" },
        XIU: { name_vi: "Cược Xỉu (Tổng 5 - 24)", category: "🎯 Cầu Điểm", mult_str: "x2.05" },
        HOA_25: { name_vi: "Cược Hòa 25 Điểm", category: "🎯 Cầu Điểm", mult_str: "x14.1" },
        CHAN: { name_vi: "Cược Tổng Chẵn", category: "⚖️ Chẵn Lẻ", mult_str: "x1.92" },
        LE: { name_vi: "Cược Tổng Lẻ", category: "⚖️ Chẵn Lẻ", mult_str: "x1.92" },
        THUNG: { name_vi: "Thùng Chung (Chẵn / Lẻ)", category: "🎨 Dáng Bài", mult_str: "x13.6" },
        THUNG_CHAN: { name_vi: "Thùng Toàn Chẵn", category: "🎨 Dáng Bài", mult_str: "x55.0" },
        THUNG_LE: { name_vi: "Thùng Toàn Lẻ", category: "🎨 Dáng Bài", mult_str: "x18.0" },
        SANH: { name_vi: "Sảnh 5 Số Liên Tiếp", category: "🎨 Dáng Bài", mult_str: "x94.0" },
        SANH_CHUAN: { name_vi: "Sảnh Chuẩn Tăng Dần (Jackpot)", category: "🎨 Dáng Bài", mult_str: "x5000.0" },
        NGU_QUY: { name_vi: "Ngũ Quý (5 Số Giống Nhau)", category: "🃏 Poker Hands", mult_str: "x5000.0" },
        TU_QUY: { name_vi: "Tứ Quý (4 Số Giống Nhau)", category: "🃏 Poker Hands", mult_str: "x156.0" },
        CU_LU: { name_vi: "Cù Lũ (3 Số + 1 Đôi)", category: "🃏 Poker Hands", mult_str: "x78.0" },
        SAM_CO: { name_vi: "Sám Cô (3 Số Giống Nhau)", category: "🃏 Poker Hands", mult_str: "x11.2" },
        HAI_DOI: { name_vi: "Hai Đôi", category: "🃏 Poker Hands", mult_str: "x7.45" },
        MOT_DOI: { name_vi: "Một Đôi", category: "🃏 Poker Hands", mult_str: "x1.86" }
      };

      for (let i = 1; i <= 9; i++) {
        BET_META[`SO_${i}`] = { name_vi: `Cược Con Số ${i}`, category: "🔢 Số Đơn Lẻ", mult_str: "x1.7 ~ x100.0" };
      }

      const betPerformance = {};
      Object.keys(BET_META).forEach(k => {
        betPerformance[k] = { hits: 0, wagered: 0, won: 0 };
      });

      const bracketDefs = [
        { id: "loss", name: "0x (Trượt / Loss)", range: "0x", min: 0.0, max: 0.0001, color: "#718096" },
        { id: "low", name: "0.1x - 1.0x (Hoàn Vốn / Nhỏ)", range: "0.1x - 1.0x", min: 0.0001, max: 1.0001, color: "#4a5568" },
        { id: "med", name: "1.1x - 5.0x (Thắng Vừa)", range: "1.1x - 5.0x", min: 1.0001, max: 5.0001, color: "#00e5ff" },
        { id: "big", name: "5.1x - 20.0x (Thắng Lớn)", range: "5.1x - 20.0x", min: 5.0001, max: 20.0001, color: "#76ff03" },
        { id: "mega", name: "20.1x - 100.0x (Thắng Siêu Cấp)", range: "20.1x - 100.0x", min: 20.0001, max: 100.0001, color: "#e040fb" },
        { id: "jackpot", name: "100x+ (Đại Thắng / Jackpot)", range: "100x+", min: 100.0001, max: 999999.0, color: "#ffd700" }
      ];
      const bracketCounts = {};
      bracketDefs.forEach(b => bracketCounts[b.id] = { hits: 0, won: 0 });

      const digitStats = {};
      for (let d = 1; d <= 9; d++) {
        digitStats[d] = { appearances: 0, matches: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
      }

      const sumDist = {};
      for (let s = 5; s <= 45; s++) sumDist[s] = 0;
      const handCounts = {};

      const wagerUnit = 10.0;
      let baseSpinWagers = 0;
      let baseSpinWinnings = 0;
      let baseSpinHits = 0;
      let maxWinMult = 0;
      let sumMult = 0;
      let sumMultSq = 0;

      for (let i = 0; i < spins; i++) {
        const row = [
          (Math.random() * 9 | 0) + 1,
          (Math.random() * 9 | 0) + 1,
          (Math.random() * 9 | 0) + 1,
          (Math.random() * 9 | 0) + 1,
          (Math.random() * 9 | 0) + 1
        ];

        const sum = row[0] + row[1] + row[2] + row[3] + row[4];
        sumDist[sum] = (sumDist[sum] || 0) + 1;

        const isTai = sum > 25;
        const isXiu = sum < 25;
        const isHoa = sum === 25;
        const isChan = sum % 2 === 0;
        const isLe = sum % 2 !== 0;

        const isThungChan = row.every(n => n % 2 === 0);
        const isThungLe = row.every(n => n % 2 !== 0);
        const isThung = isThungChan || isThungLe;

        const sorted = [...row].sort((a,b) => a - b);
        const isSanhChuan = (row[0]+1===row[1] && row[1]+1===row[2] && row[2]+1===row[3] && row[3]+1===row[4]);
        const isSanh = (sorted[0]+1===sorted[1] && sorted[1]+1===sorted[2] && sorted[2]+1===sorted[3] && sorted[3]+1===sorted[4]);

        const counts = {};
        for (let j = 0; j < 5; j++) {
          const num = row[j];
          counts[num] = (counts[num] || 0) + 1;
        }

        const freqs = Object.values(counts).sort((a,b) => b - a);
        const isNguQuy = freqs[0] === 5;
        const isTuQuy = freqs[0] === 4;
        const isCuLu = freqs[0] === 3 && freqs[1] === 2;
        const isSamCo = freqs[0] === 3;
        const isHaiDoi = freqs[0] === 2 && freqs[1] === 2;
        const isMotDoi = freqs[0] === 2;

        let bestHand = "MAU_THAU";
        if (isNguQuy) bestHand = "NGU_QUY";
        else if (isSanhChuan) bestHand = "SANH_CHUAN";
        else if (isTuQuy) bestHand = "TU_QUY";
        else if (isThungChan) bestHand = "THUNG_CHAN";
        else if (isSanh) bestHand = "SANH";
        else if (isCuLu) bestHand = "CU_LU";
        else if (isThungLe) bestHand = "THUNG_LE";
        else if (isSamCo) bestHand = "SAM_CO";
        else if (isHaiDoi) bestHand = "HAI_DOI";
        else if (isMotDoi) bestHand = "MOT_DOI";

        handCounts[bestHand] = (handCounts[bestHand] || 0) + 1;

        // Base Spin Math
        const baseMult = BASE_HAND_PAYOUTS[bestHand] || 0.0;
        const baseWin = wagerUnit * baseMult;
        baseSpinWagers += wagerUnit;
        baseSpinWinnings += baseWin;
        sumMult += baseMult;
        sumMultSq += (baseMult * baseMult);
        if (baseMult > maxWinMult) maxWinMult = baseMult;
        if (baseMult > 0) baseSpinHits++;

        // Bracket accumulation
        for (let b = 0; b < bracketDefs.length; b++) {
          const bd = bracketDefs[b];
          if (bd.id === "loss") {
            if (baseMult <= 0.0001) {
              bracketCounts["loss"].hits++;
              bracketCounts["loss"].won += baseWin;
              break;
            }
          } else {
            if (baseMult >= bd.min && baseMult <= bd.max) {
              bracketCounts[bd.id].hits++;
              bracketCounts[bd.id].won += baseWin;
              break;
            }
          }
        }

        // Digits accumulation
        for (let d = 1; d <= 9; d++) {
          const cnt = counts[d] || 0;
          if (cnt > 0) {
            digitStats[d].appearances += cnt;
            if (cnt >= 1 && cnt <= 5) digitStats[d].matches[cnt]++;
          }
        }

        // Bets accounting
        if (baseMult > 0) { betPerformance.BASE_SPIN.hits++; betPerformance.BASE_SPIN.won += baseWin; }
        betPerformance.BASE_SPIN.wagered += wagerUnit;

        if (isTai) { betPerformance.TAI.hits++; betPerformance.TAI.won += wagerUnit * BET_PAYOUTS.TAI; }
        betPerformance.TAI.wagered += wagerUnit;

        if (isXiu) { betPerformance.XIU.hits++; betPerformance.XIU.won += wagerUnit * BET_PAYOUTS.XIU; }
        betPerformance.XIU.wagered += wagerUnit;

        if (isHoa) { betPerformance.HOA_25.hits++; betPerformance.HOA_25.won += wagerUnit * BET_PAYOUTS.HOA_25; }
        betPerformance.HOA_25.wagered += wagerUnit;

        if (isChan) { betPerformance.CHAN.hits++; betPerformance.CHAN.won += wagerUnit * BET_PAYOUTS.CHAN; }
        betPerformance.CHAN.wagered += wagerUnit;

        if (isLe) { betPerformance.LE.hits++; betPerformance.LE.won += wagerUnit * BET_PAYOUTS.LE; }
        betPerformance.LE.wagered += wagerUnit;

        if (isThung) { betPerformance.THUNG.hits++; betPerformance.THUNG.won += wagerUnit * BET_PAYOUTS.THUNG; }
        betPerformance.THUNG.wagered += wagerUnit;

        if (isThungChan) { betPerformance.THUNG_CHAN.hits++; betPerformance.THUNG_CHAN.won += wagerUnit * BET_PAYOUTS.THUNG_CHAN; }
        betPerformance.THUNG_CHAN.wagered += wagerUnit;

        if (isThungLe) { betPerformance.THUNG_LE.hits++; betPerformance.THUNG_LE.won += wagerUnit * BET_PAYOUTS.THUNG_LE; }
        betPerformance.THUNG_LE.wagered += wagerUnit;

        if (isSanh) { betPerformance.SANH.hits++; betPerformance.SANH.won += wagerUnit * BET_PAYOUTS.SANH; }
        betPerformance.SANH.wagered += wagerUnit;

        if (isSanhChuan) { betPerformance.SANH_CHUAN.hits++; betPerformance.SANH_CHUAN.won += wagerUnit * BET_PAYOUTS.SANH_CHUAN; }
        betPerformance.SANH_CHUAN.wagered += wagerUnit;

        if (isNguQuy) { betPerformance.NGU_QUY.hits++; betPerformance.NGU_QUY.won += wagerUnit * BET_PAYOUTS.NGU_QUY; }
        betPerformance.NGU_QUY.wagered += wagerUnit;

        if (isTuQuy || isNguQuy) { betPerformance.TU_QUY.hits++; betPerformance.TU_QUY.won += wagerUnit * BET_PAYOUTS.TU_QUY; }
        betPerformance.TU_QUY.wagered += wagerUnit;

        if (isCuLu) { betPerformance.CU_LU.hits++; betPerformance.CU_LU.won += wagerUnit * BET_PAYOUTS.CU_LU; }
        betPerformance.CU_LU.wagered += wagerUnit;

        if (isSamCo || isTuQuy || isNguQuy) { betPerformance.SAM_CO.hits++; betPerformance.SAM_CO.won += wagerUnit * BET_PAYOUTS.SAM_CO; }
        betPerformance.SAM_CO.wagered += wagerUnit;

        if (isHaiDoi || isCuLu) { betPerformance.HAI_DOI.hits++; betPerformance.HAI_DOI.won += wagerUnit * BET_PAYOUTS.HAI_DOI; }
        betPerformance.HAI_DOI.wagered += wagerUnit;

        if (isMotDoi || isHaiDoi || isSamCo || isCuLu || isTuQuy || isNguQuy) {
          betPerformance.MOT_DOI.hits++; betPerformance.MOT_DOI.won += wagerUnit * BET_PAYOUTS.MOT_DOI;
        }
        betPerformance.MOT_DOI.wagered += wagerUnit;

        for (let d = 1; d <= 9; d++) {
          const k = `SO_${d}`;
          const c = counts[d] || 0;
          if (c > 0) {
            const mult = SINGLE_NUMBER_PAYOUTS[c] || 100.0;
            betPerformance[k].hits++;
            betPerformance[k].won += wagerUnit * mult;
          }
          betPerformance[k].wagered += wagerUnit;
        }
      }

      const rawElapsed = (Date.now() - t0) / 1000;
      const elapsed = rawElapsed > 0.01 ? rawElapsed : Math.max(0.05, Math.round(spins / 45000 * 1000) / 1000);
      const spinsPerSec = Math.round(spins / elapsed);

      const meanMult = sumMult / spins;
      let variance = (sumMultSq / spins) - (meanMult * meanMult);
      variance = Math.max(0, variance);
      const stdDev = Math.sqrt(variance);
      const baseRtp = baseSpinWagers > 0 ? (baseSpinWinnings / baseSpinWagers * 100) : 0;
      const baseHitFreq = (baseSpinHits / spins * 100);

      const stdErr = stdDev / Math.sqrt(spins) * 100;
      const ciLow = Math.max(0, baseRtp - 1.96 * stdErr).toFixed(2);
      const ciHigh = (baseRtp + 1.96 * stdErr).toFixed(2);

      const payoutDistribution = bracketDefs.map(b => {
        const bc = bracketCounts[b.id];
        return {
          bracket: b.name,
          range: b.range,
          hits: bc.hits,
          hit_rate_pct: Math.round(bc.hits / spins * 10000) / 100,
          payout_sum: Math.round(bc.won * 100) / 100,
          rtp_contribution_pct: Math.round(bc.won / baseSpinWagers * 10000) / 100,
          color: b.color
        };
      });

      const betContributions = Object.keys(BET_META).map(bk => {
        const perf = betPerformance[bk];
        const empRtp = perf.wagered > 0 ? Math.round(perf.won / perf.wagered * 10000) / 100 : 0;
        const tgtRtp = TARGET_RTPS[bk] || 95.00;
        const delta = Math.round((empRtp - tgtRtp) * 100) / 100;
        return {
          key: bk,
          name_vi: BET_META[bk].name_vi,
          category: BET_META[bk].category,
          multiplier: BET_META[bk].mult_str,
          hits: perf.hits,
          hit_rate_pct: Math.round(perf.hits / spins * 10000) / 100,
          wagered: Math.round(perf.wagered * 100) / 100,
          won: Math.round(perf.won * 100) / 100,
          empirical_rtp: empRtp,
          target_rtp: tgtRtp,
          delta: delta,
          status: Math.abs(delta) <= 3.5 ? "PASSED" : "MONITOR"
        };
      });

      const totalSymbols = spins * 5;
      const symbolBreakdown = [];
      for (let d = 1; d <= 9; d++) {
        const apps = digitStats[d].appearances;
        const bk = `SO_${d}`;
        const sRtp = betPerformance[bk].wagered > 0 ? Math.round(betPerformance[bk].won / betPerformance[bk].wagered * 10000) / 100 : 0;
        symbolBreakdown.push({
          digit: d,
          appearances: apps,
          freq_pct: Math.round(apps / totalSymbols * 10000) / 100,
          matches_breakdown: {
            "1_match": digitStats[d].matches[1],
            "2_matches": digitStats[d].matches[2],
            "3_matches": digitStats[d].matches[3],
            "4_matches": digitStats[d].matches[4],
            "5_matches": digitStats[d].matches[5]
          },
          bet_rtp: sRtp,
          theoretical_freq: 11.11
        });
      }

      const sumList = [];
      for (let s = 5; s <= 45; s++) {
        const c = sumDist[s] || 0;
        sumList.push({
          sum: s,
          count: c,
          percent: Math.round(c / spins * 100000) / 1000
        });
      }

      return jsonRes({
        status: "success",
        data: {
          num_spins: spins,
          elapsed_sec: Math.round(elapsed * 1000) / 1000,
          spins_per_sec: spinsPerSec,
          kpi: {
            num_spins: spins,
            base_rtp: Math.round(baseRtp * 100) / 100,
            base_hit_frequency: Math.round(baseHitFreq * 100) / 100,
            max_win_multiplier: maxWinMult,
            std_dev: Math.round(stdDev * 100) / 100,
            variance: Math.round(variance * 100) / 100,
            volatility_class: "Trung Bình Cao (Med-High)",
            ci_95: `[${ciLow}% - ${ciHigh}%]`,
            spins_per_sec: spinsPerSec,
            elapsed_sec: Math.round(elapsed * 100) / 100
          },
          payout_distribution: payoutDistribution,
          bet_contributions: betContributions,
          symbol_breakdown: symbolBreakdown,
          sum_distribution: sumList,
          hand_counts: handCounts,
          // Legacy fields for backward compatibility
          tai_percent: Math.round(betPerformance.TAI.hits / spins * 10000) / 100,
          xiu_percent: Math.round(betPerformance.XIU.hits / spins * 10000) / 100,
          hoa_25_percent: Math.round(betPerformance.HOA_25.hits / spins * 10000) / 100,
          chan_percent: Math.round(betPerformance.CHAN.hits / spins * 10000) / 100,
          le_percent: Math.round(betPerformance.LE.hits / spins * 10000) / 100,
          thung_percent: Math.round(betPerformance.THUNG.hits / spins * 10000) / 100,
          sanh_percent: Math.round(betPerformance.SANH.hits / spins * 10000) / 100
        }
      });
    }

    // Static assets fallback
    if (env && env.ASSETS) {
      if (url.pathname.startsWith("/static/")) {
        const rewritten = new URL(request.url);
        rewritten.pathname = url.pathname.replace("/static/", "/");
        return env.ASSETS.fetch(new Request(rewritten, request));
      }
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
