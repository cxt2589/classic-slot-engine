/**
 * Cloudflare Pages / Workers Native Serverless Backend for Retro 777 Deluxe Slot Engine.
 * 100% Serverless - zero infrastructure costs, globally distributed on Cloudflare Edge.
 */

// Symbols Definition
const Symbol = {
  WILD: "WILD",
  SCATTER: "SCATTER",
  SEVEN: "SEVEN",
  DIAMOND: "DIAMOND",
  BELL: "BELL",
  BAR_3: "BAR_3",
  BAR_2: "BAR_2",
  BAR_1: "BAR_1",
  WATERMELON: "WATERMELON",
  GRAPE: "GRAPE",
  PLUM: "PLUM",
  ORANGE: "ORANGE",
  CHERRY: "CHERRY"
};

const SYMBOL_META = {
  WILD: { name_vi: "Vương Miện Wild", name_en: "Crown Wild", icon: "👑", color: "#FFD700", is_wild: true, is_scatter: false },
  SCATTER: { name_vi: "Ngôi Sao Scatter", name_en: "Star Scatter", icon: "⭐", color: "#00E5FF", is_wild: false, is_scatter: true },
  SEVEN: { name_vi: "Số 7 Đỏ", name_en: "Lucky Red 7", icon: "7️⃣", color: "#FF1744", is_wild: false, is_scatter: false },
  DIAMOND: { name_vi: "Kim Cương", name_en: "Blue Diamond", icon: "💎", color: "#00B0FF", is_wild: false, is_scatter: false },
  BELL: { name_vi: "Chuông Vàng", name_en: "Golden Bell", icon: "🔔", color: "#FFD600", is_wild: false, is_scatter: false },
  BAR_3: { name_vi: "Triple BAR", name_en: "Triple BAR", icon: "🟩", color: "#00E676", is_wild: false, is_scatter: false },
  BAR_2: { name_vi: "Double BAR", name_en: "Double BAR", icon: "🟦", color: "#2979FF", is_wild: false, is_scatter: false },
  BAR_1: { name_vi: "Single BAR", name_en: "Single BAR", icon: "🟪", color: "#AA00FF", is_wild: false, is_scatter: false },
  WATERMELON: { name_vi: "Dưa Hấu", name_en: "Watermelon", icon: "🍉", color: "#76FF03", is_wild: false, is_scatter: false },
  GRAPE: { name_vi: "Chùm Nho", name_en: "Grapes", icon: "🍇", color: "#BA68C8", is_wild: false, is_scatter: false },
  PLUM: { name_vi: "Quả Mận", name_en: "Plum", icon: "🫐", color: "#8E24AA", is_wild: false, is_scatter: false },
  ORANGE: { name_vi: "Quả Cam", name_en: "Orange", icon: "🍊", color: "#FF9100", is_wild: false, is_scatter: false },
  CHERRY: { name_vi: "Trái Cherry", name_en: "Cherry", icon: "🍒", color: "#D50000", is_wild: false, is_scatter: false },
};

// Calibrated Paytable for 95.19% RTP
const PAYTABLE = {
  WILD: { 5: 2200.0, 4: 500.0, 3: 150.0, 2: 20.0 },
  SEVEN: { 5: 1100.0, 4: 265.0, 3: 85.0 },
  DIAMOND: { 5: 520.0, 4: 155.0, 3: 48.0 },
  BELL: { 5: 260.0, 4: 78.0, 3: 21.0 },
  BAR_3: { 5: 200.0, 4: 60.0, 3: 20.0 },
  BAR_2: { 5: 150.0, 4: 45.0, 3: 15.0 },
  BAR_1: { 5: 100.0, 4: 30.0, 3: 10.0 },
  WATERMELON: { 5: 80.0, 4: 25.0, 3: 8.0 },
  GRAPE: { 5: 70.0, 4: 20.0, 3: 7.0 },
  PLUM: { 5: 60.0, 4: 15.0, 3: 6.0 },
  ORANGE: { 5: 50.0, 4: 12.0, 3: 5.0 },
  CHERRY: { 5: 40.0, 4: 10.0, 3: 4.0, 2: 0.8 },
};

const SCATTER_PAYOUT = { 5: 100.0, 4: 20.0, 3: 4.0 };
const FREE_SPINS_AWARDED = { 5: 20, 4: 15, 3: 10 };
const FREE_SPINS_WIN_MULTIPLIER = 3.0;

// 20 Paylines
const PAYLINES = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2], [1, 0, 1, 0, 1], [1, 2, 1, 2, 1],
  [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 0, 2, 0, 0], [2, 2, 0, 2, 2], [0, 2, 0, 2, 0]
];

const PAYLINE_COLORS = [
  "#FF0055", "#00E5FF", "#FFE600", "#00E676", "#D500F9",
  "#FF6D00", "#2979FF", "#C6FF00", "#FF1744", "#1DE9B6",
  "#F50057", "#00B0FF", "#76FF03", "#651FFF", "#FF9100",
  "#3D5AFE", "#00BFA5", "#FF3D00", "#AEEA00", "#E040FB"
];

// 70-stop virtual reel strips
const BASE_REEL_STRIPS = [
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
];

const FREE_SPINS_REEL_STRIPS = [
  BASE_REEL_STRIPS[0],
  BASE_REEL_STRIPS[1].map(s => (s === Symbol.BAR_1 || s === Symbol.BAR_2) ? Symbol.WILD : s),
  BASE_REEL_STRIPS[2].map(s => (s === Symbol.BAR_1 || s === Symbol.BAR_2) ? Symbol.WILD : s),
  BASE_REEL_STRIPS[3].map(s => (s === Symbol.BAR_1 || s === Symbol.BAR_2) ? Symbol.WILD : s),
  BASE_REEL_STRIPS[4]
];

// Helper: CSPRNG Random Stop
function getRandomStop(stripLen) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % stripLen;
}

// Generate Grid from Stops
function generateGrid(stops, isFreeSpins) {
  const strips = isFreeSpins ? FREE_SPINS_REEL_STRIPS : BASE_REEL_STRIPS;
  const grid = [[], [], []];

  for (let c = 0; c < 5; c++) {
    const strip = strips[c];
    const len = strip.length;
    const stop = stops[c] % len;
    grid[0][c] = strip[stop];
    grid[1][c] = strip[(stop + 1) % len];
    grid[2][c] = strip[(stop + 2) % len];
  }
  return grid;
}

// Evaluate Grid
function evaluateGrid(grid, stops, betPerLine = 1.0, numLines = 20, isFreeSpin = false) {
  const activePaylines = PAYLINES.slice(0, numLines);
  const totalBet = isFreeSpin ? 0.0 : betPerLine * numLines;
  const effectiveBet = betPerLine * numLines;
  const winMultiplierFactor = isFreeSpin ? FREE_SPINS_WIN_MULTIPLIER : 1.0;

  const lineWins = [];

  // 1. Evaluate Paylines
  for (let lineIdx = 0; lineIdx < activePaylines.length; lineIdx++) {
    const pattern = activePaylines[lineIdx];
    const lineSymbols = [
      grid[pattern[0]][0], grid[pattern[1]][1], grid[pattern[2]][2],
      grid[pattern[3]][3], grid[pattern[4]][4]
    ];

    // Check pure Wilds
    let wildCount = 0;
    for (let sym of lineSymbols) {
      if (sym === Symbol.WILD) wildCount++;
      else break;
    }
    const wildPayout = PAYTABLE.WILD[wildCount] || 0.0;

    // Check substitution with first non-wild symbol
    let targetSym = null;
    for (let sym of lineSymbols) {
      if (sym !== Symbol.WILD) {
        targetSym = sym;
        break;
      }
    }

    let targetCount = 0;
    let targetPayout = 0.0;
    if (targetSym && targetSym !== Symbol.SCATTER) {
      for (let sym of lineSymbols) {
        if (sym === targetSym || sym === Symbol.WILD) targetCount++;
        else break;
      }
      targetPayout = (PAYTABLE[targetSym] && PAYTABLE[targetSym][targetCount]) || 0.0;
    }

    let winSymbol = null;
    let winCount = 0;
    let baseMultiplier = 0.0;

    if (targetPayout > wildPayout) {
      winSymbol = targetSym;
      winCount = targetCount;
      baseMultiplier = targetPayout;
    } else if (wildPayout > 0.0) {
      winSymbol = Symbol.WILD;
      winCount = wildCount;
      baseMultiplier = wildPayout;
    }

    if (baseMultiplier > 0.0 && winSymbol) {
      const winAmount = baseMultiplier * betPerLine * winMultiplierFactor;
      const positions = [];
      for (let c = 0; c < winCount; c++) {
        positions.push([pattern[c], c]);
      }
      lineWins.push({
        line_index: lineIdx,
        symbol: winSymbol,
        count: winCount,
        multiplier: baseMultiplier * winMultiplierFactor,
        win_amount: Math.round(winAmount * 100) / 100,
        positions: positions
      });
    }
  }

  // 2. Evaluate Scatter
  const scatterPositions = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid[r][c] === Symbol.SCATTER) {
        scatterPositions.push([r, c]);
      }
    }
  }

  const scatterCount = scatterPositions.length;
  let scatterWin = null;
  let freeSpinsWon = 0;

  if (scatterCount >= 3) {
    const mult = SCATTER_PAYOUT[scatterCount] || 0.0;
    const amount = mult * effectiveBet;
    freeSpinsWon = FREE_SPINS_AWARDED[scatterCount] || 0;
    scatterWin = {
      count: scatterCount,
      multiplier: mult,
      win_amount: Math.round(amount * 100) / 100,
      free_spins: freeSpinsWon,
      positions: scatterPositions
    };
  }

  const lineWinsTotal = lineWins.reduce((sum, w) => sum + w.win_amount, 0);
  const scatterWinsTotal = scatterWin ? scatterWin.win_amount : 0;
  const totalWin = Math.round((lineWinsTotal + scatterWinsTotal) * 100) / 100;

  return {
    grid,
    stops,
    bet_per_line: betPerLine,
    num_lines: numLines,
    total_bet: totalBet,
    total_win: totalWin,
    is_free_spin: isFreeSpin,
    free_spins_won: freeSpinsWon,
    line_wins: lineWins,
    scatter_win: scatterWin
  };
}

// In-Memory Cloudflare Worker Session
let workerSession = {
  session_id: "cf-session-" + Math.random().toString(36).substring(2, 9),
  balance: 10000.0,
  total_wagered: 0.0,
  total_won: 0.0,
  total_spins: 0,
  in_free_spins: false,
  free_spins_remaining: 0,
  free_spins_total: 0,
  free_spins_won_total: 0.0,
  free_spins_bet_per_line: 1.0,
  free_spins_num_lines: 20,
  history: []
};

// Cloudflare Worker Fetch Handler
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // JSON response helper with CORS
    const jsonResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // 1. GET /api/session
    if (url.pathname === "/api/session" && request.method === "GET") {
      const rtp = workerSession.total_wagered > 0 ? (workerSession.total_won / workerSession.total_wagered * 100) : 0;
      return jsonResponse({
        status: "success",
        data: {
          ...workerSession,
          balance: Math.round(workerSession.balance * 100) / 100,
          total_wagered: Math.round(workerSession.total_wagered * 100) / 100,
          total_won: Math.round(workerSession.total_won * 100) / 100,
          rtp_actual: Math.round(rtp * 100) / 100,
        },
        recent_history: workerSession.history.slice(0, 10)
      });
    }

    // 2. GET /api/paytable
    if (url.pathname === "/api/paytable" && request.method === "GET") {
      return jsonResponse({
        status: "success",
        data: {
          paytable: PAYTABLE,
          scatter_payout: SCATTER_PAYOUT,
          free_spins_awarded: FREE_SPINS_AWARDED,
          free_spins_win_multiplier: FREE_SPINS_WIN_MULTIPLIER,
          paylines: PAYLINES,
          payline_colors: PAYLINE_COLORS,
          symbols_meta: SYMBOL_META
        }
      });
    }

    // 3. POST /api/reset
    if (url.pathname === "/api/reset" && request.method === "POST") {
      let initialBal = 10000.0;
      try {
        const body = await request.json();
        if (body.initial_balance) initialBal = body.initial_balance;
      } catch (e) {}

      workerSession = {
        session_id: "cf-session-" + Math.random().toString(36).substring(2, 9),
        balance: initialBal,
        total_wagered: 0.0,
        total_won: 0.0,
        total_spins: 0,
        in_free_spins: false,
        free_spins_remaining: 0,
        free_spins_total: 0,
        free_spins_won_total: 0.0,
        free_spins_bet_per_line: 1.0,
        free_spins_num_lines: 20,
        history: []
      };

      return jsonResponse({
        status: "success",
        message: `Session reset with balance ${initialBal}`,
        data: workerSession
      });
    }

    // 4. POST /api/spin
    if (url.pathname === "/api/spin" && request.method === "POST") {
      let body = { bet_per_line: 1.0, num_lines: 20 };
      try {
        body = await request.json();
      } catch (e) {}

      const isFreeSpin = workerSession.in_free_spins && workerSession.free_spins_remaining > 0;
      let effectiveBetPerLine = 1.0;
      let effectiveNumLines = 20;
      let wager = 0.0;

      if (isFreeSpin) {
        effectiveBetPerLine = workerSession.free_spins_bet_per_line;
        effectiveNumLines = workerSession.free_spins_num_lines;
        workerSession.free_spins_remaining--;
      } else {
        effectiveBetPerLine = Math.max(0.1, body.bet_per_line || 1.0);
        effectiveNumLines = Math.max(1, Math.min(20, body.num_lines || 20));
        wager = effectiveBetPerLine * effectiveNumLines;

        if (workerSession.balance < wager) {
          return jsonResponse({ detail: "Insufficient balance" }, 400);
        }

        workerSession.balance -= wager;
        workerSession.total_wagered += wager;
      }

      workerSession.total_spins++;

      // Stops & Grid
      const strips = isFreeSpin ? FREE_SPINS_REEL_STRIPS : BASE_REEL_STRIPS;
      const stops = [
        getRandomStop(strips[0].length),
        getRandomStop(strips[1].length),
        getRandomStop(strips[2].length),
        getRandomStop(strips[3].length),
        getRandomStop(strips[4].length)
      ];

      const grid = generateGrid(stops, isFreeSpin);
      const result = evaluateGrid(grid, stops, effectiveBetPerLine, effectiveNumLines, isFreeSpin);

      workerSession.balance += result.total_win;
      workerSession.total_won += result.total_win;

      if (isFreeSpin) {
        workerSession.free_spins_won_total += result.total_win;
        if (result.free_spins_won > 0) {
          workerSession.free_spins_remaining += result.free_spins_won;
          workerSession.free_spins_total += result.free_spins_won;
        }
        if (workerSession.free_spins_remaining === 0) {
          workerSession.in_free_spins = false;
        }
      } else {
        if (result.free_spins_won > 0) {
          workerSession.in_free_spins = true;
          workerSession.free_spins_remaining = result.free_spins_won;
          workerSession.free_spins_total = result.free_spins_won;
          workerSession.free_spins_bet_per_line = effectiveBetPerLine;
          workerSession.free_spins_num_lines = effectiveNumLines;
          workerSession.free_spins_won_total = 0.0;
        }
      }

      const rtp = workerSession.total_wagered > 0 ? (workerSession.total_won / workerSession.total_wagered * 100) : 0;
      const sessionData = {
        ...workerSession,
        balance: Math.round(workerSession.balance * 100) / 100,
        total_wagered: Math.round(workerSession.total_wagered * 100) / 100,
        total_won: Math.round(workerSession.total_won * 100) / 100,
        rtp_actual: Math.round(rtp * 100) / 100,
      };

      workerSession.history.unshift({
        spin_number: workerSession.total_spins,
        wager,
        win: result.total_win,
        is_free_spin: isFreeSpin,
        stops
      });
      if (workerSession.history.length > 20) workerSession.history.pop();

      return jsonResponse({
        status: "success",
        data: {
          session: sessionData,
          spin_result: result
        }
      });
    }

    // 5. POST /api/simulate
    if (url.pathname === "/api/simulate" && request.method === "POST") {
      let spins = 10000;
      let betPerLine = 1.0;
      let numLines = 20;

      try {
        const body = await request.json();
        if (body.spins) spins = Math.min(50000, Math.max(100, body.spins));
        if (body.bet_per_line) betPerLine = body.bet_per_line;
        if (body.num_lines) numLines = body.num_lines;
      } catch (e) {}

      const startTime = Date.now();
      const wagerPerSpin = betPerLine * numLines;
      let totalWagered = 0;
      let totalWon = 0;
      let baseWon = 0;
      let freeWon = 0;
      let hitCount = 0;
      let freeSpinTriggers = 0;
      let totalFreeSpinsPlayed = 0;
      let maxWin = 0;
      const winMultipliers = [];

      const distribution = {
        "0x (Loss)": 0,
        "0.1x - 1x": 0,
        "1x - 5x": 0,
        "5x - 20x": 0,
        "20x - 100x": 0,
        "100x+ (Big Win)": 0,
      };
      const symbolWinAmounts = {};

      for (let i = 0; i < spins; i++) {
        totalWagered += wagerPerSpin;
        const stops = [
          getRandomStop(BASE_REEL_STRIPS[0].length),
          getRandomStop(BASE_REEL_STRIPS[1].length),
          getRandomStop(BASE_REEL_STRIPS[2].length),
          getRandomStop(BASE_REEL_STRIPS[3].length),
          getRandomStop(BASE_REEL_STRIPS[4].length)
        ];
        const grid = generateGrid(stops, false);
        const baseResult = evaluateGrid(grid, stops, betPerLine, numLines, false);

        let spinWin = baseResult.total_win;
        baseWon += baseResult.total_win;

        baseResult.line_wins.forEach(lw => {
          symbolWinAmounts[lw.symbol] = (symbolWinAmounts[lw.symbol] || 0) + lw.win_amount;
        });

        let fsQueue = baseResult.free_spins_won;
        if (fsQueue > 0) freeSpinTriggers++;

        while (fsQueue > 0) {
          totalFreeSpinsPlayed++;
          fsQueue--;
          const fsStops = [
            getRandomStop(FREE_SPINS_REEL_STRIPS[0].length),
            getRandomStop(FREE_SPINS_REEL_STRIPS[1].length),
            getRandomStop(FREE_SPINS_REEL_STRIPS[2].length),
            getRandomStop(FREE_SPINS_REEL_STRIPS[3].length),
            getRandomStop(FREE_SPINS_REEL_STRIPS[4].length)
          ];
          const fsGrid = generateGrid(fsStops, true);
          const fsResult = evaluateGrid(fsGrid, fsStops, betPerLine, numLines, true);
          freeWon += fsResult.total_win;
          spinWin += fsResult.total_win;

          fsResult.line_wins.forEach(lw => {
            const k = lw.symbol + "_FREE";
            symbolWinAmounts[k] = (symbolWinAmounts[k] || 0) + lw.win_amount;
          });
          if (fsResult.free_spins_won > 0) fsQueue += fsResult.free_spins_won;
        }

        totalWon += spinWin;
        if (spinWin > 0) hitCount++;
        if (spinWin > maxWin) maxWin = spinWin;

        const mult = spinWin / wagerPerSpin;
        winMultipliers.push(mult);

        if (mult === 0) distribution["0x (Loss)"]++;
        else if (mult <= 1.0) distribution["0.1x - 1x"]++;
        else if (mult <= 5.0) distribution["1x - 5x"]++;
        else if (mult <= 20.0) distribution["5x - 20x"]++;
        else if (mult <= 100.0) distribution["20x - 100x"]++;
        else distribution["100x+ (Big Win)"]++;
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const totalRtp = (totalWon / totalWagered) * 100;
      const baseRtp = (baseWon / totalWagered) * 100;
      const freeRtp = (freeWon / totalWagered) * 100;
      const hitFreq = (hitCount / spins) * 100;

      const mean = totalWon / totalWagered;
      const variance = winMultipliers.reduce((acc, m) => acc + Math.pow(m - mean, 2), 0) / spins;
      const stdDev = Math.sqrt(variance);

      const symbolHitsObj = {};
      Object.entries(symbolWinAmounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([sym, amt]) => {
          symbolHitsObj[sym] = Math.round((amt / totalWagered) * 10000) / 100;
        });

      return jsonResponse({
        status: "success",
        data: {
          num_spins: spins,
          elapsed_sec: Math.round(elapsed * 100) / 100,
          spins_per_sec: elapsed > 0 ? Math.round(spins / elapsed) : 0,
          total_wagered: Math.round(totalWagered * 100) / 100,
          total_won: Math.round(totalWon * 100) / 100,
          total_rtp_percent: Math.round(totalRtp * 100) / 100,
          base_game_rtp_percent: Math.round(baseRtp * 100) / 100,
          free_spins_rtp_percent: Math.round(freeRtp * 100) / 100,
          hit_frequency_percent: Math.round(hitFreq * 100) / 100,
          free_spin_triggers: freeSpinTriggers,
          free_spin_trigger_ratio: freeSpinTriggers > 0 ? `1 in ${Math.round(spins / freeSpinTriggers)}` : "N/A",
          total_free_spins_played: totalFreeSpinsPlayed,
          max_win_multiplier: Math.round((maxWin / wagerPerSpin) * 100) / 100,
          volatility_index: Math.round(stdDev * 1.96 * 100) / 100,
          standard_deviation: Math.round(stdDev * 100) / 100,
          distribution: Object.fromEntries(
            Object.entries(distribution).map(([k, v]) => [k, `${v.toLocaleString()} (${((v / spins) * 100).toFixed(1)}%)`])
          ),
          symbol_hits: symbolHitsObj
        }
      });
    }

    // 6. Static asset fallback for Cloudflare Pages
    if (env && env.ASSETS) {
      // Normalize /static/ paths to root paths
      if (url.pathname.startsWith("/static/")) {
        const rewrittenUrl = new URL(request.url);
        rewrittenUrl.pathname = url.pathname.replace("/static/", "/");
        return env.ASSETS.fetch(new Request(rewrittenUrl, request));
      }
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
