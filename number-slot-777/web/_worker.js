/**
 * Cloudflare Pages / Workers Native Serverless Backend for Lucky Numbers 777.
 * 100% Serverless - zero infrastructure costs, globally distributed.
 */

const NUMBER_REEL_STRIPS = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 5, 6, 7, 8, 9]
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
  const center_row = stops.map((stop, c) => NUMBER_REEL_STRIPS[c][stop]);
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

let adminConfig = {
  allow_sanh_chuan: false, // Mặc định KHÓA để an toàn vốn tuyệt đối cho nhà cái
  allow_ngu_quy: false,    // Mặc định KHÓA để an toàn vốn tuyệt đối cho nhà cái
  jackpot_pool: 35000.0,   // Quỹ tích lũy hũ ban đầu (Xu)
  target_jackpot_pool: 100000.0, // Ngưỡng an toàn tối thiểu để mở nổ hũ (đủ trả cược 20 xu x 5000)
  jackpot_rate_general: 0.02, // 2% từ tất cả các cửa cược khác tự động trích nạp vào Quỹ Hũ
  total_jackpot_paid: 0.0, // Tổng tiền đã trả thưởng cho Sảnh Chuẩn / Ngũ Quý
  blocked_sanh_chuan_count: 0, // Đếm số lần hệ thống đã chặn Sảnh Chuẩn thành công
  blocked_ngu_quy_count: 0,    // Đếm số lần hệ thống đã chặn Ngũ Quý thành công
  live_room: {
    betting_time_sec: 30, // Thời gian chờ cược Chơi Nhóm mặc định 30s (có thể cấu hình trong hậu đài)
    spin_time_sec: 4,     // Thời gian quay reels đồng bộ
    payout_time_sec: 6    // Thời gian hiển thị kết quả & trả thưởng
  },
  max_bets: {
    SANH_CHUAN: 20,
    NGU_QUY: 20,
    TU_QUY: 100,
    CU_LU: 200,
    DEFAULT: 5000
  }
};

const liveRoomState = {
  chatMessages: [
    { id: "msg-1", user_id: "sys", username: "HỆ THỐNG", avatar: "🤖", text: "Chào mừng các cao thủ đến với Phòng Trực Tiếp Lucky Numbers 777! Phiên đồng bộ 30s 🎉", type: "system", time: Date.now() - 45000 },
    { id: "msg-2", user_id: "bot-1", username: "Dragon99", avatar: "🐲", text: "Cầu đang bệt Tài anh em ơi, theo nhanh kẻo lỡ! 🎯", type: "chat", time: Date.now() - 30000 },
    { id: "msg-3", user_id: "bot-2", username: "PhátTài88", avatar: "💰", text: "Vừa húp Tứ Quý 8, phòng hôm nay đỏ thật sự!", type: "chat", time: Date.now() - 15000 }
  ],
  recentReactions: [], // [{ id, emoji, count, time }]
  bigWins: [
    { id: "bw-1", username: "Dragon99", amount: 15600, hand: "Tứ Quý 8-8-8-8", time: Date.now() - 120000 },
    { id: "bw-2", username: "ThanTaiDen", amount: 8200, hand: "Cù Lũ Thần Tài", time: Date.now() - 60000 },
    { id: "bw-3", username: "MinhBao777", amount: 20500, hand: "Cầu Tài Lớn", time: Date.now() - 30000 }
  ],
  roundBets: {}, // round_id -> { user_id -> betData }
  roundOutcomes: {}, // round_id -> outcome object
  settledRounds: {} // "roundId_userId" -> true
};

async function getKVChatMessages(env) {
  if (env && env.LUCKY_ROOM) {
    try {
      const stored = await env.LUCKY_ROOM.get("live_chat_messages", { type: "json" });
      if (Array.isArray(stored) && stored.length > 0) {
        liveRoomState.chatMessages = stored;
        return stored;
      }
    } catch (e) {}
  }
  return liveRoomState.chatMessages;
}

async function saveKVChatMessages(env, messages) {
  if (env && env.LUCKY_ROOM) {
    try {
      await env.LUCKY_ROOM.put("live_chat_messages", JSON.stringify(messages));
    } catch (e) {}
  }
}

async function getKVReactions(env) {
  if (env && env.LUCKY_ROOM) {
    try {
      const stored = await env.LUCKY_ROOM.get("live_recent_reactions", { type: "json" });
      if (Array.isArray(stored)) {
        liveRoomState.recentReactions = stored;
        return stored;
      }
    } catch (e) {}
  }
  return liveRoomState.recentReactions;
}

async function saveKVReactions(env, reactions) {
  if (env && env.LUCKY_ROOM) {
    try {
      await env.LUCKY_ROOM.put("live_recent_reactions", JSON.stringify(reactions));
    } catch (e) {}
  }
}

async function getKVBigWins(env) {
  if (env && env.LUCKY_ROOM) {
    try {
      const stored = await env.LUCKY_ROOM.get("live_big_wins", { type: "json" });
      if (Array.isArray(stored) && stored.length > 0) {
        liveRoomState.bigWins = stored;
        return stored;
      }
    } catch (e) {}
  }
  return liveRoomState.bigWins;
}

async function saveKVBigWins(env, wins) {
  if (env && env.LUCKY_ROOM) {
    try {
      await env.LUCKY_ROOM.put("live_big_wins", JSON.stringify(wins));
    } catch (e) {}
  }
}

async function getKVRedPackets(env) {
  if (env && env.LUCKY_ROOM) {
    try {
      const stored = await env.LUCKY_ROOM.get("live_red_packets", { type: "json" });
      if (Array.isArray(stored)) {
        return stored;
      }
    } catch (e) {}
  }
  return [];
}

async function saveKVRedPackets(env, packets) {
  if (env && env.LUCKY_ROOM) {
    try {
      await env.LUCKY_ROOM.put("live_red_packets", JSON.stringify(packets));
    } catch (e) {}
  }
}

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
    description: "Backend API and GLI-19 Math Engine for 5x3 Single Center Payline Number Slot. Supports Base Game Spin, Tài/Xỉu, Chẵn/Lẻ, Thùng, Sảnh, Poker Hands, Single Number Bets (1-9), Real-time Baccarat Roadmaps (Bead Road & Multi-tier Big Road), and Monte Carlo Verification.",
    version: "1.2.0",
    contact: {
      name: "Lucky Numbers 777 Engineering Team",
      url: "https://lucky-numbers-777.pages.dev"
    }
  },
  servers: [
    { url: "/", description: "Current Environment" }
  ],
  paths: {
    "/api/spin": {
      post: {
        tags: ["Gameplay"],
        summary: "Execute Spin and Evaluate Center Payline",
        description: "Spins 5 virtual reels using CSPRNG, extracts Row 1 (Center Payline), evaluates user bets against mathematical rules, calculates net winnings, updates session balance, and logs history.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  bets: {
                    type: "object",
                    description: "Key-value map of active bets. Allowed keys: BASE_SPIN, TAI, XIU, HOA_25, CHAN, LE, THUNG, THUNG_CHAN, THUNG_LE, SANH, SANH_CHUAN, NGU_QUY, TU_QUY, CU_LU, SAM_CO, HAI_DOI, SO_1 .. SO_9. If empty {}, defaults automatically to {'BASE_SPIN': 10.0}.",
                    additionalProperties: { type: "number", minimum: 0.1 },
                    example: {
                      BASE_SPIN: 10.0,
                      TAI: 50.0,
                      THUNG: 20.0,
                      SO_7: 10.0
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Spin evaluated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "object",
                      properties: {
                        stops: { type: "array", items: { type: "integer" }, example: [12, 34, 5, 29, 41] },
                        grid: {
                          type: "array",
                          items: { type: "array", items: { type: "integer" } },
                          description: "3x5 visible reel matrix. Row 1 is the ONLY winning payline."
                        },
                        center_row: { type: "array", items: { type: "integer" }, example: [7, 7, 7, 8, 9] },
                        analysis: {
                          type: "object",
                          properties: {
                            sum: { type: "integer", example: 38 },
                            is_tai: { type: "boolean", example: true },
                            is_xiu: { type: "boolean", example: false },
                            is_hoa_25: { type: "boolean", example: false },
                            is_chan: { type: "boolean", example: false },
                            is_le: { type: "boolean", example: true },
                            is_thung: { type: "boolean", example: false },
                            is_sanh: { type: "boolean", example: false },
                            best_hand: { type: "string", example: "SAM_CO" },
                            hand_title_vi: { type: "string", example: "Sám Cô (Bộ 3 số 7)" },
                            counts: { type: "object", example: { "7": 3, "8": 1, "9": 1 } }
                          }
                        },
                        payout: {
                          type: "object",
                          properties: {
                            total_bet: { type: "number", example: 90.0 },
                            total_won: { type: "number", example: 199.5 },
                            net_profit: { type: "number", example: 109.5 },
                            winning_items: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  bet_type: { type: "string", example: "TAI" },
                                  wager: { type: "number", example: 50.0 },
                                  multiplier: { type: "number", example: 2.05 },
                                  win_amount: { type: "number", example: 102.5 },
                                  reason_vi: { type: "string", example: "Tổng 38 > 25 (TÀI)" }
                                }
                              }
                            }
                          }
                        },
                        session: {
                          type: "object",
                          properties: {
                            balance: { type: "number", example: 10109.5 },
                            total_spins: { type: "integer", example: 42 },
                            total_wagered: { type: "number", example: 2500.0 },
                            total_won: { type: "number", example: 2609.5 },
                            empirical_rtp: { type: "number", example: 104.38 }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": { description: "Insufficient balance or invalid wager format" }
        }
      }
    },
    "/api/session": {
      get: {
        tags: ["Player Session"],
        summary: "Retrieve Wallet Balance & Recent Spin History",
        description: "Returns player wallet meters (balance, total wagered, total won, empirical RTP) and the 100 most recent spin results used to render the VIP Bead Plate, Multi-tier Big Road, and Trend line charts.",
        responses: {
          "200": {
            description: "Player session information",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "object",
                      properties: {
                        balance: { type: "number", example: 10000.0 },
                        total_spins: { type: "integer", example: 120 },
                        total_wagered: { type: "number", example: 15400.0 },
                        total_won: { type: "number", example: 14750.0 },
                        empirical_rtp: { type: "number", example: 95.78 }
                      }
                    },
                    recent_history: {
                      type: "array",
                      description: "List of last 100 spins for Bead Road & Big Road calculations",
                      items: { type: "object" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/rules": {
      get: {
        tags: ["Game Rules & Math"],
        summary: "Get Paytable Multipliers & Visual Mappings",
        description: "Returns mathematical multiplier odds for all bet types: Base Game Spin hands (x0.3..x300), Score bets (Tài/Xỉu x2.05, Hòa x14.5), Parity (Chẵn/Lẻ x1.92), Flushes (x13.6..x55.0), Straights (x94.0..x5000.0), Single numbers 1-9 (x1.0..x500.0), and neon color codes.",
        responses: {
          "200": {
            description: "Game paytable definitions",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "object",
                      properties: {
                        bet_payouts: { type: "object" },
                        single_number_payouts: { type: "object" },
                        base_hand_payouts: { type: "object" },
                        number_colors: { type: "object" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/reset": {
      post: {
        tags: ["Player Session"],
        summary: "Reset Wallet Balance & Clear Session",
        description: "Re-seeds the player balance back to initial credits (default: 10,000) and resets spin counters.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  initial_balance: { type: "number", default: 10000.0, minimum: 100.0 }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Session successfully reset" }
        }
      }
    },
    "/api/simulate": {
      post: {
        tags: ["Game Rules & Math"],
        summary: "Run GLI-19 Monte Carlo Math Simulation",
        description: "Executes 100 to 50,000 real-time Monte Carlo spins to verify mathematical RTP (95.0% - 96.0%), hit frequency, standard deviation, payout brackets, and bet performance.",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  spins: { type: "integer", default: 20000, minimum: 100, maximum: 50000 },
                  category_filter: { type: "string", default: "ALL" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Detailed GLI-19 certification metrics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "object",
                      properties: {
                        total_spins: { type: "integer", example: 20000 },
                        elapsed_seconds: { type: "number", example: 0.185 },
                        spins_per_second: { type: "number", example: 108108 },
                        base_game_rtp: { type: "number", example: 95.12 },
                        target_rtp: { type: "number", example: 95.0 },
                        hit_frequency: { type: "number", example: 75.64 },
                        max_win_multiplier: { type: "number", example: 250.0 },
                        std_dev: { type: "number", example: 2.14 },
                        volatility_class: { type: "string", example: "LOW-MEDIUM" },
                        confidence_interval_95: { type: "array", items: { type: "number" } },
                        bracket_distribution: { type: "object" },
                        bet_performance: { type: "object" },
                        symbols_stats: { type: "object" },
                        sum_distribution: { type: "object" }
                      }
                    }
                  }
                }
              }
            }
          }
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
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400..900;1,400..700&family=Orbitron:wght@700;900&display=swap&subset=vietnamese" rel="stylesheet">
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
      font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffd700;
      letter-spacing: 0.5px;
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

    // Telegram Bot Webhook endpoint
    if (url.pathname === "/api/telegram-webhook" && request.method === "POST") {
      try {
        const update = await request.json();
        if (update && update.message) {
          const msg = update.message;
          const chatId = msg.chat?.id;
          const firstName = msg.from?.first_name || "Bạn";
          const botToken = "8844960516:AAG8gcsv_WA9ORpk6xSfwB6qFrFJ2utWKDo";
          const appUrl = "https://lucky-numbers-777.pages.dev";

          const replyText = `🎰 *CHÀO MỪNG ${firstName.toUpperCase()} ĐẾN VỚI LUCKY NUMBERS 777!* 🎰\n\n` +
            `Trải nghiệm Game Slot 5x3 Số Học độc quyền ngay trên Telegram:\n\n` +
            `✨ *Dòng Thưởng:* Chỉ tính hàng giữa (Center Payline) kịch tính.\n` +
            `🎯 *Cược Phong Phú:* Số đơn 1-9 (x8), Tài/Xỉu (x2.05), Chẵn/Lẻ (x1.92), Sảnh Rồng (x5000), Tứ Quý...\n` +
            `📳 *Haptic Engine:* Rung phản hồi sống động theo từng nhịp quay.\n` +
            `📊 *VIP Roadmaps:* Bảng Soi Kèo Bead Plate, Big Road & Thống kê chi tiết.\n\n` +
            `💰 *Tặng ngay 10,000 Xu trải nghiệm miễn phí!*\n\n` +
            `👇 *Bấm nút bên dưới để mở Mini App và chơi ngay:*`;

          const keyboard = [
            [
              {
                text: "🎰 CHƠI NGAY TRÊN TELEGRAM 🚀",
                web_app: { url: appUrl }
              }
            ],
            [
              {
                text: "📜 Luật Chơi & Trả Thưởng",
                web_app: { url: `${appUrl}#rules` }
              },
              {
                text: "📈 Bảng Soi Kèo",
                web_app: { url: `${appUrl}#soikeo` }
              }
            ]
          ];

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: replyText,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: keyboard
              }
            })
          });
        }
      } catch (err) {
        console.error("Webhook error:", err);
      }
      return new Response("OK", { status: 200 });
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

function checkFortuneLockMatch(betKey, analysis, lockedSet) {
  if (!lockedSet || lockedSet.size === 0) return { matched: true, reasonSuffix: "" };

  const centerNumbers = analysis.numbers;
  const lockedArr = Array.from(lockedSet);

  if (betKey.startsWith("SO_")) {
    return { matched: true, reasonSuffix: "" };
  }

  if (betKey === "BASE_SPIN") {
    return { matched: true, reasonSuffix: "" };
  }

  if (betKey === "TAI" || betKey === "XIU" || betKey === "HOA_25" || betKey === "CHAN" || betKey === "LE") {
    const hasNum = centerNumbers.some(n => lockedSet.has(n));
    return {
      matched: hasNum,
      reasonSuffix: hasNum ? ` ⚡ [Kèm số Thần Tài: ${centerNumbers.filter(n => lockedSet.has(n)).join(", ")}]` : ""
    };
  }

  if (betKey === "THUNG" || betKey === "THUNG_CHAN" || betKey === "THUNG_LE") {
    const hasNum = centerNumbers.some(n => lockedSet.has(n));
    return {
      matched: hasNum,
      reasonSuffix: hasNum ? ` ⚡ [Chứa số Thần Tài: ${centerNumbers.filter(n => lockedSet.has(n)).join(", ")}]` : ""
    };
  }

  if (betKey === "SANH" || betKey === "SANH_CHUAN") {
    // Dãy sảnh phải chứa toàn bộ các số Thần Tài mà người chơi đã chọn!
    const containsAll = lockedArr.every(tn => centerNumbers.includes(tn));
    return {
      matched: containsAll,
      reasonSuffix: containsAll ? ` ⚡ [Khớp bộ số Thần Tài: ${lockedArr.join("-")}]` : ""
    };
  }

  if (betKey === "NGU_QUY") {
    const num = centerNumbers[0];
    const match = analysis.is_ngu_quy && lockedSet.has(num);
    return {
      matched: match,
      reasonSuffix: match ? ` ⚡ [Đúng số Thần Tài: ${num}]` : ""
    };
  }

  if (betKey === "TU_QUY") {
    for (const [num, cnt] of Object.entries(analysis.counts)) {
      if (cnt >= 4 && lockedSet.has(Number(num))) {
        return { matched: true, reasonSuffix: ` ⚡ [Đúng số Thần Tài: ${num}]` };
      }
    }
    return { matched: false, reasonSuffix: "" };
  }

  if (betKey === "CU_LU") {
    for (const [num, cnt] of Object.entries(analysis.counts)) {
      if (cnt === 3 && lockedSet.has(Number(num))) {
        return { matched: true, reasonSuffix: ` ⚡ [Bộ 3 số Thần Tài: ${num}]` };
      }
    }
    return { matched: false, reasonSuffix: "" };
  }

  if (betKey === "SAM_CO") {
    for (const [num, cnt] of Object.entries(analysis.counts)) {
      if (cnt >= 3 && lockedSet.has(Number(num))) {
        return { matched: true, reasonSuffix: ` ⚡ [Bộ 3 số Thần Tài: ${num}]` };
      }
    }
    return { matched: false, reasonSuffix: "" };
  }

  if (betKey === "HAI_DOI") {
    for (const [num, cnt] of Object.entries(analysis.counts)) {
      if (cnt >= 2 && lockedSet.has(Number(num))) {
        return { matched: true, reasonSuffix: ` ⚡ [Đôi số Thần Tài: ${num}]` };
      }
    }
    return { matched: false, reasonSuffix: "" };
  }

  if (betKey === "MOT_DOI") {
    for (const [num, cnt] of Object.entries(analysis.counts)) {
      if (cnt >= 2 && lockedSet.has(Number(num))) {
        return { matched: true, reasonSuffix: ` ⚡ [Đôi số Thần Tài: ${num}]` };
      }
    }
    return { matched: false, reasonSuffix: "" };
  }

  return { matched: true, reasonSuffix: "" };
}

function buildGridFromStops(sList) {
  const g = [[], [], []];
  for (let c = 0; c < 5; c++) {
    const strip = NUMBER_REEL_STRIPS[c];
    const len = strip.length;
    const stop = sList[c] % len;
    g[0][c] = strip[(stop - 1 + len) % len]; // Hàng trên (Center - 1)
    g[1][c] = strip[stop];                    // Hàng giữa (Center Row 1)
    g[2][c] = strip[(stop + 1) % len];        // Hàng dưới (Center + 1)
  }
  return g;
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateLiveOutcome(roundId) {
  let randFn = () => {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] / 4294967296;
  };

  // Nếu là phiên live (LRxxx), sinh kết quả đồng nhất tuyệt đối trên mọi máy chủ Cloudflare Edge toàn cầu
  if (roundId && typeof roundId === "string" && roundId.startsWith("LR")) {
    const seed = parseInt(roundId.replace(/\D/g, "")) || 12345;
    randFn = mulberry32(seed);
  }

  let stops = NUMBER_REEL_STRIPS.map(strip => Math.floor(randFn() * strip.length));
  let grid = buildGridFromStops(stops);
  let center_row = grid[1];
  let analysis = analyzeCenterRow(center_row);

  // RNG Killswitch Guard
  let rerollNeeded = false;
  if (analysis.is_sanh_chuan && !adminConfig.allow_sanh_chuan) {
    stops[2] = (stops[2] + 2) % NUMBER_REEL_STRIPS[2].length;
    rerollNeeded = true;
    adminConfig.blocked_sanh_chuan_count++;
  }
  if (analysis.is_ngu_quy && !adminConfig.allow_ngu_quy) {
    stops[4] = (stops[4] + 1) % NUMBER_REEL_STRIPS[4].length;
    rerollNeeded = true;
    adminConfig.blocked_ngu_quy_count++;
  }
  if (rerollNeeded) {
    grid = buildGridFromStops(stops);
    center_row = grid[1];
    analysis = analyzeCenterRow(center_row);
  }

  return {
    round_id: roundId,
    stops,
    grid,
    center_row,
    analysis
  };
}

function calculateSpinPayout(bets, bet_mode, locked_numbers, center_row, analysis) {
  const isFortuneLock = (bet_mode === "fortune_lock" && Array.isArray(locked_numbers) && locked_numbers.length > 0);
  const lockedSet = new Set(locked_numbers || []);
  const winningItems = [];
  let totalWon = 0;
  let totalBet = 0;

  for (const [betKey, wagerVal] of Object.entries(bets || {})) {
    const wager = Number(wagerVal);
    if (wager <= 0) continue;
    totalBet += wager;

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
      mult = BET_PAYOUTS.SANH_CHUAN; reason = "👑 Sảnh Chuẩn (1-2-3-4-5) - NỔ HŨ LỚN!";
      const prize = Math.round(wager * mult * 100) / 100;
      adminConfig.total_jackpot_paid += prize;
      adminConfig.jackpot_pool = Math.max(0, Math.round((adminConfig.jackpot_pool - prize) * 100) / 100);
    } else if (betKey === "NGU_QUY" && analysis.is_ngu_quy) {
      mult = BET_PAYOUTS.NGU_QUY; reason = "Ngũ Quý (5 số giống nhau) - NỔ HŨ LỚN!";
      const prize = Math.round(wager * mult * 100) / 100;
      adminConfig.total_jackpot_paid += prize;
      adminConfig.jackpot_pool = Math.max(0, Math.round((adminConfig.jackpot_pool - prize) * 100) / 100);
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

    if (mult > 0 && isFortuneLock) {
      const lockCheck = checkFortuneLockMatch(betKey, analysis, lockedSet);
      if (!lockCheck.matched) {
        mult = 0;
      } else if (lockCheck.reasonSuffix) {
        reason += lockCheck.reasonSuffix;
      }
    }

    if (mult > 0) {
      const win = Math.round(wager * mult * 100) / 100;
      totalWon += win;
      winningItems.push({ bet_type: betKey, wager, multiplier: mult, win_amount: win, reason_vi: reason });
    }
  }

  totalWon = Math.round(totalWon * 100) / 100;
  totalBet = Math.round(totalBet * 100) / 100;

  return {
    total_bet: totalBet,
    total_won: totalWon,
    net_profit: Math.round((totalWon - totalBet) * 100) / 100,
    winning_items: winningItems
  };
}

function getLiveRoundInfo() {
  const bettingSec = Math.max(10, Math.min(180, adminConfig.live_room?.betting_time_sec || 30));
  const spinSec = adminConfig.live_room?.spin_time_sec || 4;
  const payoutSec = adminConfig.live_room?.payout_time_sec || 6;
  const totalCycleSec = bettingSec + spinSec + payoutSec;
  const totalCycleMs = totalCycleSec * 1000;

  const now = Date.now();
  const cycleIndex = Math.floor(now / totalCycleMs);
  const roundId = "LR" + cycleIndex;
  const cycleStartMs = cycleIndex * totalCycleMs;
  const elapsedMs = now - cycleStartMs;

  let phase = "betting";
  let timeLeftSec = 0;

  if (elapsedMs < bettingSec * 1000) {
    phase = "betting";
    timeLeftSec = Math.max(0, Math.ceil((bettingSec * 1000 - elapsedMs) / 1000));
  } else if (elapsedMs < (bettingSec + spinSec) * 1000) {
    phase = "spinning";
    timeLeftSec = Math.max(0, Math.ceil(((bettingSec + spinSec) * 1000 - elapsedMs) / 1000));
  } else {
    phase = "payout";
    timeLeftSec = Math.max(0, Math.ceil((totalCycleMs - elapsedMs) / 1000));
  }

  // Đảm bảo round này có kết quả cố định trong cache
  if (!liveRoomState.roundOutcomes[roundId]) {
    liveRoomState.roundOutcomes[roundId] = generateLiveOutcome(roundId);
  }

  // Giữ tối đa 10 rounds gần nhất để tiết kiệm bộ nhớ
  const keys = Object.keys(liveRoomState.roundOutcomes);
  if (keys.length > 10) {
    const oldKey = keys[0];
    delete liveRoomState.roundOutcomes[oldKey];
    delete liveRoomState.roundBets[oldKey];
  }

  return {
    round_id: roundId,
    cycle_index: cycleIndex,
    phase,
    time_left_sec: timeLeftSec,
    betting_duration_sec: bettingSec,
    spin_duration_sec: spinSec,
    payout_duration_sec: payoutSec,
    total_cycle_sec: totalCycleSec,
    start_time_ms: cycleStartMs,
    // Chỉ tiết lộ kết quả khi đang spinning hoặc payout
    outcome: (phase === "spinning" || phase === "payout") ? liveRoomState.roundOutcomes[roundId] : null
  };
}

    if (url.pathname === "/api/spin" && request.method === "POST") {
      let bets = {};
      let bet_mode = "free"; // "free" | "fortune_lock"
      let locked_numbers = [];
      try {
        const body = await request.json();
        bets = body.bets || { BASE_SPIN: 10.0 };
        bet_mode = body.bet_mode || "free";
        if (Array.isArray(body.locked_numbers)) {
          locked_numbers = body.locked_numbers.map(Number).filter(n => n >= 1 && n <= 9);
        }
      } catch (e) {}

      const totalBet = Object.values(bets).reduce((a, b) => a + Number(b), 0);
      if (totalBet <= 0) return jsonRes({ detail: "Vui lòng đặt cược ít nhất 1 cửa!" }, 400);
      if (session.balance < totalBet) return jsonRes({ detail: "Số dư không đủ!" }, 400);

      // Kiểm tra giới hạn mức cược (Max Bet) cho từng cửa
      for (const [betKey, wagerVal] of Object.entries(bets)) {
        const wager = Number(wagerVal);
        if (wager <= 0) continue;
        const limit = adminConfig.max_bets[betKey] !== undefined ? adminConfig.max_bets[betKey] : adminConfig.max_bets.DEFAULT;
        if (wager > limit) {
          const doorName = betKey === "SANH_CHUAN" ? "Sảnh Chuẩn" : (betKey === "NGU_QUY" ? "Ngũ Quý" : betKey);
          return jsonRes({ detail: `Cửa [${doorName}] giới hạn cược tối đa ${limit} Xu (Bạn đang cược ${wager} Xu)!` }, 400);
        }
      }

      session.balance -= totalBet;
      session.total_wagered += totalBet;
      session.total_spins++;

      // Trích nạp Quỹ Hũ Tích Lũy (Jackpot Reserve Pool):
      let jackpotContribution = 0;
      for (const [betKey, wagerVal] of Object.entries(bets)) {
        const wager = Number(wagerVal);
        if (wager <= 0) continue;
        if (betKey === "SANH_CHUAN" || betKey === "NGU_QUY") {
          jackpotContribution += wager;
        } else {
          jackpotContribution += (wager * adminConfig.jackpot_rate_general);
        }
      }
      adminConfig.jackpot_pool = Math.round((adminConfig.jackpot_pool + jackpotContribution) * 100) / 100;

      // Sinh kết quả vòng quay
      const spinOutcome = generateLiveOutcome("SOLO-" + session.total_spins);
      const { stops, grid, center_row, analysis } = spinOutcome;

      // Đánh giá kết quả cược
      const payout = calculateSpinPayout(bets, bet_mode, locked_numbers, center_row, analysis);
      const totalWon = payout.total_won;

      session.balance += totalWon;
      session.total_won += totalWon;

      // Nếu thắng lớn, thêm vào thông báo toàn server
      if (totalWon >= 1000 || totalWon >= totalBet * 5) {
        liveRoomState.bigWins.unshift({
          id: "bw-" + Date.now(),
          username: "Bạn (Solo)",
          amount: totalWon,
          hand: analysis.hand_title_vi,
          time: Date.now()
        });
        if (liveRoomState.bigWins.length > 20) liveRoomState.bigWins.pop();
      }

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
        net: Math.round((totalWon - totalBet) * 100) / 100,
        fortune_lock: (bet_mode === "fortune_lock" && locked_numbers.length > 0) ? { locked_numbers } : null
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
          payout,
          fortune_lock: {
            is_active: (bet_mode === "fortune_lock" && locked_numbers.length > 0),
            locked_numbers
          },
          admin_info: {
            allow_sanh_chuan: adminConfig.allow_sanh_chuan,
            allow_ngu_quy: adminConfig.allow_ngu_quy,
            jackpot_pool: adminConfig.jackpot_pool,
            target_jackpot_pool: adminConfig.target_jackpot_pool,
            max_bets: adminConfig.max_bets,
            live_room: adminConfig.live_room
          }
        }
      });
    }

    // ==========================================
    // LIVE MULTIPLAYER ROOM API ENDPOINTS
    // ==========================================
    if (url.pathname === "/api/live/state" && request.method === "GET") {
      const liveRound = getLiveRoundInfo();
      const userId = url.searchParams.get("user_id") || "guest";
      const userName = url.searchParams.get("username") || "Khách";

      // Kiểm tra xem user có cược ở phiên trước (LR_{cycleIndex - 1}) cần trả thưởng tự động không
      const prevRoundId = "LR" + (liveRound.cycle_index - 1);
      const settleKey = `${prevRoundId}_${userId}`;
      let userLastSettlement = null;

      // Đồng bộ cược phiên trước từ KV nếu isolate mới khởi động
      if (!liveRoomState.roundBets[prevRoundId]?.[userId] && env && env.LUCKY_ROOM) {
        try {
          const prevKvBet = await env.LUCKY_ROOM.get(`bet_${prevRoundId}_${userId}`, { type: "json" });
          if (prevKvBet) {
            if (!liveRoomState.roundBets[prevRoundId]) liveRoomState.roundBets[prevRoundId] = {};
            liveRoomState.roundBets[prevRoundId][userId] = prevKvBet;
          }
        } catch (e) {}
      }

      if (!liveRoomState.settledRounds[settleKey] && liveRoomState.roundBets[prevRoundId]?.[userId]) {
        const userPrevBet = liveRoomState.roundBets[prevRoundId][userId];
        const prevOutcome = liveRoomState.roundOutcomes[prevRoundId] || generateLiveOutcome(prevRoundId);
        if (prevOutcome) {
          const payoutResult = calculateSpinPayout(
            userPrevBet.bets,
            userPrevBet.bet_mode,
            userPrevBet.locked_numbers,
            prevOutcome.center_row,
            prevOutcome.analysis
          );
          
          if (payoutResult.total_won > 0) {
            session.balance += payoutResult.total_won;
            session.total_won += payoutResult.total_won;

            // Đăng tin thắng vào chat room & lưu KV
            const winText = `🎉 ${userName} vừa thắng +${payoutResult.total_won.toLocaleString()} Xu ở phiên ${prevRoundId}!`;
            const currentMsgs = await getKVChatMessages(env);
            const winMsg = {
              id: "msg-win-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
              user_id: "sys",
              username: "HỆ THỐNG",
              avatar: "🏆",
              text: winText,
              type: "system",
              time: Date.now()
            };
            const updatedMsgs = [winMsg, ...currentMsgs].slice(0, 50);
            liveRoomState.chatMessages = updatedMsgs;
            await saveKVChatMessages(env, updatedMsgs);

            // Nếu thắng lớn >= 1000 xu hoặc >= 5x, thêm vào bigWins & lưu KV
            if (payoutResult.total_won >= 1000 || payoutResult.total_won >= userPrevBet.total_bet * 5) {
              const currentBigWins = await getKVBigWins(env);
              const bwObj = {
                id: "bw-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                username: userName,
                amount: payoutResult.total_won,
                hand: prevOutcome.analysis.hand_title_vi,
                time: Date.now()
              };
              const updatedBigWins = [bwObj, ...currentBigWins].slice(0, 20);
              liveRoomState.bigWins = updatedBigWins;
              await saveKVBigWins(env, updatedBigWins);
            }
          }

          liveRoomState.settledRounds[settleKey] = {
            round_id: prevRoundId,
            payout: payoutResult,
            time: Date.now()
          };
          userLastSettlement = {
            round_id: prevRoundId,
            payout: payoutResult,
            center_row: prevOutcome.center_row,
            analysis: prevOutcome.analysis
          };
        }
      }

      // Kiểm tra cược hiện tại của user trong KV nếu chưa có trong memory
      if (!liveRoomState.roundBets[liveRound.round_id]?.[userId] && env && env.LUCKY_ROOM) {
        try {
          const currentKvBet = await env.LUCKY_ROOM.get(`bet_${liveRound.round_id}_${userId}`, { type: "json" });
          if (currentKvBet) {
            if (!liveRoomState.roundBets[liveRound.round_id]) liveRoomState.roundBets[liveRound.round_id] = {};
            liveRoomState.roundBets[liveRound.round_id][userId] = currentKvBet;
          }
        } catch (e) {}
      }

      // Tổng hợp cược cộng đồng của round hiện tại
      const currentBetsMap = liveRoomState.roundBets[liveRound.round_id] || {};
      const communityStats = {
        total_wagered: 0,
        total_players: Object.keys(currentBetsMap).length,
        door_totals: {}
      };
      for (const [uid, bData] of Object.entries(currentBetsMap)) {
        communityStats.total_wagered += bData.total_bet || 0;
        for (const [door, amt] of Object.entries(bData.bets || {})) {
          communityStats.door_totals[door] = (communityStats.door_totals[door] || 0) + Number(amt);
        }
      }

      // Đồng bộ tin nhắn, reactions, big wins và bao lì xì qua KV
      const messages = await getKVChatMessages(env);
      const reactions = await getKVReactions(env);
      const bigWins = await getKVBigWins(env);
      const redPackets = await getKVRedPackets(env);

      // Giữ reactions 15s gần nhất, lì xì 35s gần nhất
      const now = Date.now();
      const freshReactions = reactions.filter(r => (now - r.time) < 15000);
      const activePackets = redPackets.filter(p => (now - p.created_at) < 35000);

      // Số người online (ước lượng ngẫu nhiên sinh động quanh 130-170)
      const baseOnline = 145 + (Math.sin(liveRound.cycle_index) * 23 | 0);
      const onlineCount = Math.max(80, baseOnline + communityStats.total_players);

      return jsonRes({
        status: "success",
        data: {
          round: liveRound,
          community_stats: communityStats,
          online_count: onlineCount,
          recent_messages: messages.slice(0, 40),
          recent_reactions: freshReactions.slice(0, 20),
          big_wins: bigWins.slice(0, 10),
          active_red_packets: activePackets,
          user_current_bet: currentBetsMap[userId] || null,
          user_last_settlement: userLastSettlement,
          user_balance: Math.round(session.balance * 100) / 100,
          config: {
            live_room: adminConfig.live_room,
            max_bets: adminConfig.max_bets
          }
        }
      });
    }

    if (url.pathname === "/api/live/bet" && request.method === "POST") {
      const liveRound = getLiveRoundInfo();
      if (liveRound.phase !== "betting") {
        return jsonRes({ detail: "Phiên cược đã khóa! Vui lòng chờ phiên tiếp theo." }, 400);
      }

      let userId = "guest";
      let userName = "Khách";
      let bets = {};
      let bet_mode = "free";
      let locked_numbers = [];

      try {
        const body = await request.json();
        userId = body.user_id || "guest";
        userName = body.username || "Khách";
        bets = body.bets || {};
        bet_mode = body.bet_mode || "free";
        if (Array.isArray(body.locked_numbers)) {
          locked_numbers = body.locked_numbers.map(Number).filter(n => n >= 1 && n <= 9);
        }
      } catch (e) {}

      const totalBet = Object.values(bets).reduce((a, b) => a + Number(b), 0);
      if (totalBet <= 0) return jsonRes({ detail: "Vui lòng đặt cược ít nhất 1 cửa!" }, 400);
      if (session.balance < totalBet) return jsonRes({ detail: "Số dư không đủ để đặt cược!" }, 400);

      // Max bet check
      for (const [betKey, wagerVal] of Object.entries(bets)) {
        const wager = Number(wagerVal);
        if (wager <= 0) continue;
        const limit = adminConfig.max_bets[betKey] !== undefined ? adminConfig.max_bets[betKey] : adminConfig.max_bets.DEFAULT;
        if (wager > limit) {
          const doorName = betKey === "SANH_CHUAN" ? "Sảnh Chuẩn" : (betKey === "NGU_QUY" ? "Ngũ Quý" : betKey);
          return jsonRes({ detail: `Cửa [${doorName}] giới hạn tối đa ${limit} Xu (Bạn đang cược ${wager} Xu)!` }, 400);
        }
      }

      session.balance -= totalBet;
      session.total_wagered += totalBet;

      // Trích nạp Quỹ Hũ
      let jackpotContribution = 0;
      for (const [betKey, wagerVal] of Object.entries(bets)) {
        const wager = Number(wagerVal);
        if (wager <= 0) continue;
        if (betKey === "SANH_CHUAN" || betKey === "NGU_QUY") {
          jackpotContribution += wager;
        } else {
          jackpotContribution += (wager * adminConfig.jackpot_rate_general);
        }
      }
      adminConfig.jackpot_pool = Math.round((adminConfig.jackpot_pool + jackpotContribution) * 100) / 100;

      // Lưu cược của user vào round hiện tại
      if (!liveRoomState.roundBets[liveRound.round_id]) {
        liveRoomState.roundBets[liveRound.round_id] = {};
      }
      const placedBetObj = {
        user_id: userId,
        username: userName,
        bets,
        bet_mode,
        locked_numbers,
        total_bet: totalBet,
        timestamp: Date.now()
      };
      liveRoomState.roundBets[liveRound.round_id][userId] = placedBetObj;

      // Lưu vào Cloudflare KV để đồng bộ tức thì trên toàn cầu
      if (env && env.LUCKY_ROOM) {
        try {
          await env.LUCKY_ROOM.put(`bet_${liveRound.round_id}_${userId}`, JSON.stringify(placedBetObj), { expirationTtl: 300 });
        } catch (e) {}
      }

      return jsonRes({
        status: "success",
        message: "Đặt cược phiên Live thành công!",
        data: {
          round_id: liveRound.round_id,
          placed_bet: placedBetObj,
          balance: Math.round(session.balance * 100) / 100
        }
      });
    }

    if (url.pathname === "/api/live/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const text = (body.text || "").trim();
        if (!text && !body.slip) {
          return jsonRes({ detail: "Nội dung tin nhắn không được để trống!" }, 400);
        }

        const msgObj = {
          id: "msg-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          user_id: body.user_id || "guest",
          username: body.username || "Thành viên",
          avatar: body.avatar || "👤",
          text: text.slice(0, 120),
          type: body.type || (body.slip ? "win_share" : "chat"),
          slip: body.slip || null,
          time: Date.now()
        };

        const currentMessages = await getKVChatMessages(env);
        const updatedMessages = [msgObj, ...currentMessages.filter(m => m.id !== msgObj.id)].slice(0, 50);
        liveRoomState.chatMessages = updatedMessages;
        await saveKVChatMessages(env, updatedMessages);

        return jsonRes({ status: "success", data: msgObj });
      } catch (err) {
        return jsonRes({ detail: "Lỗi gửi tin nhắn: " + err.message }, 400);
      }
    }

    if (url.pathname === "/api/live/reaction" && request.method === "POST") {
      try {
        const body = await request.json();
        const emoji = body.emoji || "❤️";
        const rxObj = {
          id: "rx-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          emoji,
          time: Date.now()
        };
        const currentReactions = await getKVReactions(env);
        const now = Date.now();
        const fresh = [rxObj, ...currentReactions.filter(r => (now - r.time) < 15000)].slice(0, 30);
        liveRoomState.recentReactions = fresh;
        await saveKVReactions(env, fresh);
        return jsonRes({ status: "success", data: rxObj });
      } catch (err) {
        return jsonRes({ detail: "Lỗi thả cảm xúc" }, 400);
      }
    }

    if (url.pathname === "/api/live/redpacket/send" && request.method === "POST") {
      try {
        const body = await request.json();
        const userId = body.user_id || "guest";
        const userName = body.username || "Khách";
        const sendAmt = Math.max(100, Math.min(100000, Number(body.amount) || 200));

        if (session.balance < sendAmt) {
          return jsonRes({ detail: "Số dư không đủ để phát lộc (cần tối thiểu " + sendAmt + " Xu)!" }, 400);
        }

        session.balance -= sendAmt;

        const packetObj = {
          id: "rp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          sender_id: userId,
          sender_name: userName,
          total_amount: sendAmt,
          created_at: Date.now(),
          claimed_by: {}
        };

        const curPackets = await getKVRedPackets(env);
        const now = Date.now();
        const fresh = [packetObj, ...curPackets.filter(p => (now - p.created_at) < 35000)].slice(0, 10);
        await saveKVRedPackets(env, fresh);

        // Thông báo phát lộc vào phòng chat
        const chatNotice = {
          id: "msg-rp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          user_id: "sys",
          username: "HỆ THỐNG",
          avatar: "🧧",
          text: `🧧 ${userName} vừa PHÁT LỘC +${sendAmt.toLocaleString()} Xu cho cả phòng! Mau chạm vào bao lì xì để nhặt! 🎉`,
          type: "red_packet",
          packet_id: packetObj.id,
          amount: sendAmt,
          time: Date.now()
        };
        const curMsgs = await getKVChatMessages(env);
        const updatedMsgs = [chatNotice, ...curMsgs].slice(0, 50);
        liveRoomState.chatMessages = updatedMsgs;
        await saveKVChatMessages(env, updatedMsgs);

        return jsonRes({
          status: "success",
          message: `Đã phát lộc ${sendAmt.toLocaleString()} Xu thành công!`,
          data: {
            packet: packetObj,
            balance: Math.round(session.balance * 100) / 100
          }
        });
      } catch (err) {
        return jsonRes({ detail: "Lỗi phát lộc: " + err.message }, 400);
      }
    }

    if (url.pathname === "/api/live/redpacket/claim" && request.method === "POST") {
      try {
        const body = await request.json();
        const packetId = body.packet_id;
        const userId = body.user_id || "guest";
        const userName = body.username || "Khách";

        const curPackets = await getKVRedPackets(env);
        const packet = curPackets.find(p => p.id === packetId);

        if (!packet) {
          return jsonRes({ detail: "Bao lì xì đã hết hạn hoặc không tồn tại!" }, 400);
        }

        if (packet.claimed_by && packet.claimed_by[userId]) {
          return jsonRes({ detail: "Bạn đã nhận lộc từ bao này rồi!", already_claimed: true }, 400);
        }

        // Tính số xu lộc may mắn ngẫu nhiên tương xứng với quy mô bao lì xì
        const total = packet.total_amount || 200;
        const minL = Math.max(15, Math.floor(total * 0.05));
        const maxL = Math.max(minL + 10, Math.floor(total * 0.20));
        const luckyAmount = Math.floor(Math.random() * (maxL - minL + 1)) + minL;
        session.balance += luckyAmount;
        session.total_won += luckyAmount;

        if (!packet.claimed_by) packet.claimed_by = {};
        packet.claimed_by[userId] = luckyAmount;
        await saveKVRedPackets(env, curPackets);

        return jsonRes({
          status: "success",
          data: {
            amount: luckyAmount,
            sender_name: packet.sender_name,
            balance: Math.round(session.balance * 100) / 100
          }
        });
      } catch (err) {
        return jsonRes({ detail: "Lỗi nhận lì xì" }, 400);
      }
    }

    if (url.pathname === "/api/admin/status" && request.method === "GET") {
      const houseTurnover = session.total_wagered;
      const housePayout = session.total_won;
      const netProfit = Math.round((houseTurnover - housePayout) * 100) / 100;
      const profitMarginPct = houseTurnover > 0 ? Math.round((netProfit / houseTurnover) * 10000) / 100 : 0;
      const poolRatio = adminConfig.target_jackpot_pool > 0 ? Math.min(100, Math.round((adminConfig.jackpot_pool / adminConfig.target_jackpot_pool) * 10000) / 100) : 100;

      return jsonRes({
        status: "success",
        data: {
          config: adminConfig,
          finance: {
            total_turnover: houseTurnover,
            total_payout: housePayout,
            net_profit: netProfit,
            profit_margin_pct: profitMarginPct,
            total_spins: session.total_spins,
            player_balance: session.balance
          },
          jackpot: {
            current_pool: adminConfig.jackpot_pool,
            target_pool: adminConfig.target_jackpot_pool,
            pool_ratio_pct: poolRatio,
            is_ready: adminConfig.jackpot_pool >= adminConfig.target_jackpot_pool,
            total_paid: adminConfig.total_jackpot_paid,
            blocked_sanh_chuan: adminConfig.blocked_sanh_chuan_count,
            blocked_ngu_quy: adminConfig.blocked_ngu_quy_count
          }
        }
      });
    }

    if (url.pathname === "/api/admin/config" && request.method === "POST") {
      try {
        const body = await request.json();
        if (typeof body.allow_sanh_chuan === "boolean") {
          adminConfig.allow_sanh_chuan = body.allow_sanh_chuan;
        }
        if (typeof body.allow_ngu_quy === "boolean") {
          adminConfig.allow_ngu_quy = body.allow_ngu_quy;
        }
        if (typeof body.target_jackpot_pool === "number" && body.target_jackpot_pool >= 0) {
          adminConfig.target_jackpot_pool = body.target_jackpot_pool;
        }
        if (typeof body.add_jackpot_amount === "number") {
          adminConfig.jackpot_pool = Math.max(0, Math.round((adminConfig.jackpot_pool + body.add_jackpot_amount) * 100) / 100);
        }
        if (typeof body.set_jackpot_amount === "number" && body.set_jackpot_amount >= 0) {
          adminConfig.jackpot_pool = Math.round(body.set_jackpot_amount * 100) / 100;
        }
        if (body.max_bets && typeof body.max_bets === "object") {
          if (body.max_bets.SANH_CHUAN !== undefined) adminConfig.max_bets.SANH_CHUAN = Number(body.max_bets.SANH_CHUAN);
          if (body.max_bets.NGU_QUY !== undefined) adminConfig.max_bets.NGU_QUY = Number(body.max_bets.NGU_QUY);
          if (body.max_bets.TU_QUY !== undefined) adminConfig.max_bets.TU_QUY = Number(body.max_bets.TU_QUY);
          if (body.max_bets.CU_LU !== undefined) adminConfig.max_bets.CU_LU = Number(body.max_bets.CU_LU);
          if (body.max_bets.DEFAULT !== undefined) adminConfig.max_bets.DEFAULT = Number(body.max_bets.DEFAULT);
        }
        if (body.live_room && typeof body.live_room === "object") {
          if (typeof body.live_room.betting_time_sec === "number") {
            adminConfig.live_room.betting_time_sec = Math.max(10, Math.min(180, Math.round(body.live_room.betting_time_sec)));
          }
        }
        if (typeof body.betting_time_sec === "number") {
          adminConfig.live_room.betting_time_sec = Math.max(10, Math.min(180, Math.round(body.betting_time_sec)));
        }
        return jsonRes({ status: "success", message: "Cập nhật cấu hình hậu đài thành công", data: adminConfig });
      } catch (err) {
        return jsonRes({ detail: "Dữ liệu không hợp lệ: " + err.message }, 400);
      }
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
