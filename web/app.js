/**
 * Retro 777 Deluxe - Game Client & Simulator Controller
 */

// Global Game State
const state = {
  session: null,
  paytableData: null,
  betPerLine: 1.0,
  numLines: 20,
  isSpinning: false,
  isAutoSpin: false,
  isTurbo: false,
  soundEnabled: true,
  audioCtx: null,
};

const BET_STEPS = [0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0];

// Web Audio API Sound Synthesizer (Zero external dependencies)
const soundEngine = {
  init() {
    if (!state.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) state.audioCtx = new AudioContext();
    }
  },

  playClick() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, state.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, state.audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, state.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, state.audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.start();
      osc.stop(state.audioCtx.currentTime + 0.05);
    } catch (e) {}
  },

  playReelStop() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, state.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, state.audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, state.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, state.audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.start();
      osc.stop(state.audioCtx.currentTime + 0.08);
    } catch (e) {}
  },

  playWinChime() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = state.audioCtx.createOscillator();
        const gain = state.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.2, state.audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(state.audioCtx.destination);
        osc.start(state.audioCtx.currentTime + idx * 0.08);
        osc.stop(state.audioCtx.currentTime + idx * 0.08 + 0.3);
      });
    } catch (e) {}
  },

  playBigWin() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      const fanfare = [392, 523.25, 659.25, 783.99, 1046.50, 1318.51];
      fanfare.forEach((freq, idx) => {
        const osc = state.audioCtx.createOscillator();
        const gain = state.audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.18, state.audioCtx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(state.audioCtx.destination);
        osc.start(state.audioCtx.currentTime + idx * 0.1);
        osc.stop(state.audioCtx.currentTime + idx * 0.1 + 0.4);
      });
    } catch (e) {}
  }
};

// DOM Elements
const dom = {
  // Navigation
  tabBtns: document.querySelectorAll(".tab-btn"),
  tabContents: document.querySelectorAll(".tab-content"),
  soundToggle: document.getElementById("soundToggle"),

  // Slot cabinet meters
  meterBalance: document.getElementById("meterBalance"),
  meterTotalBet: document.getElementById("meterTotalBet"),
  meterWin: document.getElementById("meterWin"),
  statusMessage: document.getElementById("statusMessage"),
  jackpotCounter: document.getElementById("jackpotCounter"),

  // Free spins banner
  freeSpinsBanner: document.getElementById("freeSpinsBanner"),
  fsRemainingCount: document.getElementById("fsRemainingCount"),
  fsTotalWon: document.getElementById("fsTotalWon"),

  // Reel screen & overlay
  reelsContainer: document.getElementById("reelsContainer"),
  paylineSvg: document.getElementById("paylineSvg"),
  winBanner: document.getElementById("winBanner"),
  winBannerTitle: document.getElementById("winBannerTitle"),
  winBannerAmount: document.getElementById("winBannerAmount"),
  winBreakdown: document.getElementById("winBreakdown"),

  // Controls
  valBetPerLine: document.getElementById("valBetPerLine"),
  valNumLines: document.getElementById("valNumLines"),
  btnBetMinus: document.getElementById("btnBetMinus"),
  btnBetPlus: document.getElementById("btnBetPlus"),
  btnLinesMinus: document.getElementById("btnLinesMinus"),
  btnLinesPlus: document.getElementById("btnLinesPlus"),
  btnMaxBet: document.getElementById("btnMaxBet"),
  btnAutoSpin: document.getElementById("btnAutoSpin"),
  btnTurbo: document.getElementById("btnTurbo"),
  btnSpin: document.getElementById("btnSpin"),
  btnResetBalance: document.getElementById("btnResetBalance"),

  // Simulator
  simSpinsSelect: document.getElementById("simSpinsSelect"),
  simBetPerLine: document.getElementById("simBetPerLine"),
  simNumLines: document.getElementById("simNumLines"),
  btnRunSim: document.getElementById("btnRunSim"),
  simLoading: document.getElementById("simLoading"),
  simResults: document.getElementById("simResults"),
  metricTotalRtp: document.getElementById("metricTotalRtp"),
  metricBaseRtp: document.getElementById("metricBaseRtp"),
  metricFreeRtp: document.getElementById("metricFreeRtp"),
  metricHitFreq: document.getElementById("metricHitFreq"),
  metricFsRatio: document.getElementById("metricFsRatio"),
  metricVolatility: document.getElementById("metricVolatility"),
  metricMaxWin: document.getElementById("metricMaxWin"),
  metricSpeed: document.getElementById("metricSpeed"),
  distributionBars: document.getElementById("distributionBars"),
  symbolContributions: document.getElementById("symbolContributions"),

  // Paytable
  paytableSymbolsGrid: document.getElementById("paytableSymbolsGrid"),
  paylinesGrid: document.getElementById("paylinesGrid"),
};

// Initial Setup
async function initApp() {
  setupNavigation();
  setupControls();
  await loadPaytable();
  await refreshSession();
  renderInitialReels();
  renderPaylinesDiagram();

  // Subtle Jackpot ticking animation
  setInterval(() => {
    const cur = parseFloat(dom.jackpotCounter.textContent.replace(/,/g, "")) || 100000;
    dom.jackpotCounter.textContent = (cur + 0.12).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, 2000);
}

// Navigation Tabs
function setupNavigation() {
  dom.tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      dom.tabBtns.forEach(b => b.classList.remove("active"));
      dom.tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const targetId = `tab-${btn.dataset.tab}`;
      document.getElementById(targetId)?.classList.add("active");
    });
  });

  dom.soundToggle.addEventListener("click", () => {
    soundEngine.init();
    state.soundEnabled = !state.soundEnabled;
    dom.soundToggle.textContent = state.soundEnabled ? "🔊" : "🔇";
    dom.soundToggle.style.opacity = state.soundEnabled ? "1" : "0.5";
  });
}

// Load Paytable & Symbol info from Backend
async function loadPaytable() {
  try {
    const res = await fetch("/api/paytable");
    const json = await res.json();
    if (json.status === "success") {
      state.paytableData = json.data;
      renderPaytableTab();
    }
  } catch (err) {
    console.error("Failed to load paytable:", err);
  }
}

// Refresh Session info
async function refreshSession() {
  try {
    const res = await fetch("/api/session");
    const json = await res.json();
    if (json.status === "success") {
      state.session = json.data;
      updateCabinetMeters();
    }
  } catch (err) {
    console.error("Failed to refresh session:", err);
  }
}

// Update Meters
function updateCabinetMeters(winAmount = 0) {
  if (!state.session) return;
  dom.meterBalance.textContent = state.session.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalBet = state.session.in_free_spins ? 0.0 : state.betPerLine * state.numLines;
  dom.meterTotalBet.textContent = totalBet.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (winAmount > 0) {
    dom.meterWin.textContent = winAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Free spins banner
  if (state.session.in_free_spins) {
    dom.freeSpinsBanner.classList.remove("hidden");
    dom.fsRemainingCount.textContent = state.session.free_spins_remaining;
    dom.fsTotalWon.textContent = state.session.free_spins_won_total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    dom.btnSpin.querySelector(".spin-text").textContent = "FREE";
  } else {
    dom.freeSpinsBanner.classList.add("hidden");
    dom.btnSpin.querySelector(".spin-text").textContent = "QUAY";
  }
}

// Initial 5x3 Reels Grid
function renderInitialReels() {
  const initialSymbols = [
    ["SEVEN", "BELL", "DIAMOND", "CHERRY", "WILD"],
    ["CHERRY", "SEVEN", "SEVEN", "BAR_3", "BELL"],
    ["ORANGE", "WATERMELON", "GRAPE", "PLUM", "SEVEN"],
  ];
  updateReelGrid(initialSymbols);
}

// Update Reel Display Elements
function updateReelGrid(grid) {
  for (let c = 0; c < 5; c++) {
    const stripEl = document.getElementById(`reel-${c}`);
    stripEl.innerHTML = "";
    for (let r = 0; r < 3; r++) {
      const symKey = grid[r][c];
      const meta = state.paytableData?.symbols_meta[symKey] || {
        icon: "🎰",
        name_vi: symKey,
        color: "#fff",
      };
      const cell = document.createElement("div");
      cell.className = "reel-symbol-cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.dataset.symbol = symKey;
      cell.innerHTML = `
        <span class="symbol-icon">${meta.icon}</span>
        <span class="symbol-name" style="color:${meta.color}">${meta.name_vi}</span>
      `;
      stripEl.appendChild(cell);
    }
  }
}

// Setup User Controls
function setupControls() {
  dom.btnBetMinus.addEventListener("click", () => {
    soundEngine.init();
    soundEngine.playClick();
    const idx = BET_STEPS.indexOf(state.betPerLine);
    if (idx > 0) {
      state.betPerLine = BET_STEPS[idx - 1];
      dom.valBetPerLine.textContent = state.betPerLine.toFixed(1);
      updateCabinetMeters();
    }
  });

  dom.btnBetPlus.addEventListener("click", () => {
    soundEngine.init();
    soundEngine.playClick();
    const idx = BET_STEPS.indexOf(state.betPerLine);
    if (idx < BET_STEPS.length - 1) {
      state.betPerLine = BET_STEPS[idx + 1];
      dom.valBetPerLine.textContent = state.betPerLine.toFixed(1);
      updateCabinetMeters();
    }
  });

  dom.btnLinesMinus.addEventListener("click", () => {
    soundEngine.init();
    soundEngine.playClick();
    if (state.numLines > 1) {
      state.numLines--;
      dom.valNumLines.textContent = state.numLines;
      updateCabinetMeters();
    }
  });

  dom.btnLinesPlus.addEventListener("click", () => {
    soundEngine.init();
    soundEngine.playClick();
    if (state.numLines < 20) {
      state.numLines++;
      dom.valNumLines.textContent = state.numLines;
      updateCabinetMeters();
    }
  });

  dom.btnMaxBet.addEventListener("click", () => {
    soundEngine.init();
    soundEngine.playClick();
    state.betPerLine = 10.0;
    state.numLines = 20;
    dom.valBetPerLine.textContent = state.betPerLine.toFixed(1);
    dom.valNumLines.textContent = state.numLines;
    updateCabinetMeters();
  });

  dom.btnAutoSpin.addEventListener("click", () => {
    soundEngine.init();
    soundEngine.playClick();
    state.isAutoSpin = !state.isAutoSpin;
    if (state.isAutoSpin) {
      dom.btnAutoSpin.classList.add("active");
      dom.btnAutoSpin.textContent = "AUTO (ON)";
      if (!state.isSpinning) triggerSpin();
    } else {
      dom.btnAutoSpin.classList.remove("active");
      dom.btnAutoSpin.textContent = "AUTO (OFF)";
    }
  });

  dom.btnTurbo.addEventListener("click", () => {
    soundEngine.init();
    soundEngine.playClick();
    state.isTurbo = !state.isTurbo;
    if (state.isTurbo) {
      dom.btnTurbo.classList.add("active");
      dom.btnTurbo.textContent = "⚡ TURBO: BẬT";
    } else {
      dom.btnTurbo.classList.remove("active");
      dom.btnTurbo.textContent = "⚡ TURBO: TẮT";
    }
  });

  dom.btnSpin.addEventListener("click", () => {
    soundEngine.init();
    if (!state.isSpinning) {
      triggerSpin();
    }
  });

  dom.btnResetBalance.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initial_balance: 10000.0 }),
      });
      const json = await res.json();
      if (json.status === "success") {
        state.session = json.data;
        updateCabinetMeters();
        dom.statusMessage.textContent = "SỐ DƯ ĐÃ ĐƯỢC NẠP LẠI 10,000 CREDITS!";
      }
    } catch (e) {
      console.error(e);
    }
  });

  // Simulator Run Button
  dom.btnRunSim.addEventListener("click", runMonteCarloSimulation);
}

// Spin Flow
async function triggerSpin() {
  if (state.isSpinning) return;

  clearPaylineDrawings();
  dom.winBanner.classList.remove("show");
  dom.winBreakdown.innerHTML = "";

  // Check balance if not in free spins
  const totalBet = state.session?.in_free_spins ? 0.0 : state.betPerLine * state.numLines;
  if (!state.session?.in_free_spins && state.session?.balance < totalBet) {
    dom.statusMessage.textContent = "SỐ DƯ KHÔNG ĐỦ! HÃY GIẢM CƯỢC HOẶC RESET SỐ DƯ.";
    state.isAutoSpin = false;
    dom.btnAutoSpin.classList.remove("active");
    dom.btnAutoSpin.textContent = "AUTO (OFF)";
    return;
  }

  state.isSpinning = true;
  dom.btnSpin.disabled = true;
  dom.statusMessage.textContent = state.session?.in_free_spins ? "ĐANG QUAY VÒNG MIỄN PHÍ..." : "ĐANG QUAY CUỘN...";

  // Start spinning animation on reel strips
  for (let c = 0; c < 5; c++) {
    const stripEl = document.getElementById(`reel-${c}`);
    stripEl.classList.add("reel-spinning");
  }

  try {
    const response = await fetch("/api/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bet_per_line: state.betPerLine,
        num_lines: state.numLines,
      }),
    });
    const result = await response.json();

    if (result.status !== "success") {
      throw new Error(result.detail || "Spin error");
    }

    const { session, spin_result } = result.data;
    state.session = session;

    // Staggered stop timing
    const reelDelay = state.isTurbo ? 50 : 250;
    const initialDelay = state.isTurbo ? 100 : 400;

    for (let c = 0; c < 5; c++) {
      await new Promise(r => setTimeout(r, c === 0 ? initialDelay : reelDelay));
      const stripEl = document.getElementById(`reel-${c}`);
      stripEl.classList.remove("reel-spinning");

      // Populate final column symbols
      for (let r = 0; r < 3; r++) {
        const symKey = spin_result.grid[r][c];
        const meta = state.paytableData?.symbols_meta[symKey] || { icon: "🎰", name_vi: symKey, color: "#fff" };
        const cell = stripEl.children[r];
        if (cell) {
          cell.dataset.symbol = symKey;
          cell.innerHTML = `
            <span class="symbol-icon">${meta.icon}</span>
            <span class="symbol-name" style="color:${meta.color}">${meta.name_vi}</span>
          `;
        }
      }
      soundEngine.playReelStop();
    }

    // Process Wins
    handleSpinResults(spin_result);
  } catch (err) {
    console.error("Spin request failed:", err);
    dom.statusMessage.textContent = "LỖI KẾT NỐI SERVER!";
    for (let c = 0; c < 5; c++) {
      document.getElementById(`reel-${c}`).classList.remove("reel-spinning");
    }
  } finally {
    state.isSpinning = false;
    dom.btnSpin.disabled = false;
    updateCabinetMeters();

    // Auto spin continuation
    if (state.isAutoSpin) {
      setTimeout(() => {
        if (state.isAutoSpin) triggerSpin();
      }, state.isTurbo ? 600 : 1500);
    }
  }
}

// Handle Wins Presentation
function handleSpinResults(spinResult) {
  const totalWin = spinResult.total_win;
  const isFreeSpin = spinResult.is_free_spin;

  if (totalWin > 0) {
    dom.meterWin.textContent = totalWin.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    dom.statusMessage.textContent = `CHÚC MỪNG! BẠN ĐÃ THẮNG ${totalWin.toFixed(2)} CREDITS!`;

    // Highlight winning cells
    highlightWinningPositions(spinResult);

    // Draw winning paylines
    drawPaylines(spinResult.line_wins);

    // Render win items breakdown
    renderWinBreakdown(spinResult);

    // Check for Big Win popup (>10x bet)
    const effectiveBet = spinResult.bet_per_line * spinResult.num_lines;
    const multiplier = effectiveBet > 0 ? totalWin / effectiveBet : 1;

    if (multiplier >= 15.0) {
      dom.winBannerTitle.textContent = "MEGA WIN!";
      dom.winBannerAmount.textContent = `+${totalWin.toFixed(2)}`;
      dom.winBanner.classList.add("show");
      soundEngine.playBigWin();
    } else if (multiplier >= 5.0) {
      dom.winBannerTitle.textContent = "BIG WIN!";
      dom.winBannerAmount.textContent = `+${totalWin.toFixed(2)}`;
      dom.winBanner.classList.add("show");
      soundEngine.playBigWin();
    } else {
      soundEngine.playWinChime();
    }
  } else {
    dom.meterWin.textContent = "0.00";
    dom.statusMessage.textContent = isFreeSpin ? "LƯỢT QUAY NÀY CHƯA TRÚNG THƯỞNG." : "CHƯA TRÚNG. CHÚC BẠN MAY MẮN LƯỢT TIẾP THEO!";
  }

  // Check if Free Spins were awarded this spin
  if (spinResult.free_spins_won > 0) {
    dom.statusMessage.textContent = `🔥 KÍCH HOẠT ${spinResult.free_spins_won} VÒNG QUAY MIỄN PHÍ! 🔥`;
    soundEngine.playBigWin();
  }
}

// Highlight Winning Cells on Grid
function highlightWinningPositions(spinResult) {
  // Collect all unique [row, col] winning cells
  const winMap = new Set();

  spinResult.line_wins.forEach(lw => {
    lw.positions.forEach(([r, c]) => winMap.add(`${r}-${c}`));
  });

  if (spinResult.scatter_win) {
    spinResult.scatter_win.positions.forEach(([r, c]) => winMap.add(`${r}-${c}`));
  }

  winMap.forEach(pos => {
    const [r, c] = pos.split("-");
    const stripEl = document.getElementById(`reel-${c}`);
    if (stripEl && stripEl.children[r]) {
      stripEl.children[r].classList.add("winning-cell");
    }
  });
}

// Clear Winning Highlights & SVG Lines
function clearPaylineDrawings() {
  document.querySelectorAll(".winning-cell").forEach(c => c.classList.remove("winning-cell"));
  dom.paylineSvg.innerHTML = "";
}

// Draw Payline Paths on SVG Overlay
function drawPaylines(lineWins) {
  if (!lineWins || lineWins.length === 0) return;
  const svg = dom.paylineSvg;
  svg.innerHTML = "";

  const containerRect = dom.reelsContainer.getBoundingClientRect();

  lineWins.forEach(lw => {
    const color = state.paytableData?.payline_colors[lw.line_index] || "#ffd700";
    const points = [];

    lw.positions.forEach(([r, c]) => {
      const stripEl = document.getElementById(`reel-${c}`);
      const cellEl = stripEl.children[r];
      if (cellEl) {
        const cellRect = cellEl.getBoundingClientRect();
        const x = cellRect.left - containerRect.left + cellRect.width / 2;
        const y = cellRect.top - containerRect.top + cellRect.height / 2;
        points.push(`${x},${y}`);
      }
    });

    if (points.length > 1) {
      const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      polyline.setAttribute("points", points.join(" "));
      polyline.setAttribute("stroke", color);
      polyline.setAttribute("stroke-width", "4");
      polyline.setAttribute("stroke-linecap", "round");
      polyline.setAttribute("stroke-linejoin", "round");
      polyline.setAttribute("fill", "none");
      polyline.setAttribute("filter", "drop-shadow(0 0 6px " + color + ")");
      polyline.style.opacity = "0.85";
      svg.appendChild(polyline);
    }
  });
}

// Render Win Breakdown Pills
function renderWinBreakdown(spinResult) {
  dom.winBreakdown.innerHTML = "";

  spinResult.line_wins.forEach(lw => {
    const meta = state.paytableData?.symbols_meta[lw.symbol] || { icon: "🎰", name_vi: lw.symbol };
    const pill = document.createElement("div");
    pill.className = "win-item-pill";
    pill.innerHTML = `
      <span>Dòng ${lw.line_index + 1}:</span>
      <span>${meta.icon} ${lw.count}x ${meta.name_vi}</span>
      <strong>+${lw.win_amount.toFixed(2)}</strong>
    `;
    dom.winBreakdown.appendChild(pill);
  });

  if (spinResult.scatter_win) {
    const sw = spinResult.scatter_win;
    const pill = document.createElement("div");
    pill.className = "win-item-pill";
    pill.style.borderColor = "var(--neon-cyan)";
    pill.innerHTML = `
      <span>⭐ Scatter:</span>
      <span>${sw.count}x Ngôi Sao</span>
      <strong>+${sw.win_amount.toFixed(2)} (+${sw.free_spins} Free Spins)</strong>
    `;
    dom.winBreakdown.appendChild(pill);
  }
}

// Render Paytable Tab
function renderPaytableTab() {
  if (!state.paytableData) return;
  const grid = dom.paytableSymbolsGrid;
  grid.innerHTML = "";

  const paytable = state.paytableData.paytable;
  const meta = state.paytableData.symbols_meta;

  for (const [symKey, pays] of Object.entries(paytable)) {
    const sMeta = meta[symKey] || { icon: "🎰", name_vi: symKey, color: "#fff" };
    const card = document.createElement("div");
    card.className = "sym-card";

    let paysHtml = "";
    // Sort counts descending: 5, 4, 3, 2
    Object.keys(pays)
      .map(Number)
      .sort((a, b) => b - a)
      .forEach(cnt => {
        paysHtml += `<span>${cnt}x : <strong>${pays[cnt]}x</strong> cược dòng</span>`;
      });

    card.innerHTML = `
      <div class="sym-card-icon">${sMeta.icon}</div>
      <div class="sym-card-info">
        <h5 style="color:${sMeta.color}">${sMeta.name_vi}</h5>
        <div class="sym-card-pays">${paysHtml}</div>
      </div>
    `;
    grid.appendChild(card);
  }
}

// Render 20 Paylines Diagrams
function renderPaylinesDiagram() {
  if (!state.paytableData) return;
  const container = dom.paylinesGrid;
  container.innerHTML = "";

  const paylines = state.paytableData.paylines;
  const colors = state.paytableData.payline_colors;

  paylines.forEach((line, idx) => {
    const card = document.createElement("div");
    card.className = "payline-mini-card";
    const color = colors[idx] || "#ffd700";

    let gridHtml = '<div class="pl-grid-mini">';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const isActive = line[c] === r;
        gridHtml += `<div class="pl-cell-mini ${isActive ? "active" : ""}" style="${isActive ? `background:${color};box-shadow:0 0 4px ${color}` : ""}"></div>`;
      }
    }
    gridHtml += "</div>";

    card.innerHTML = `
      <div class="pl-title" style="color:${color}">DÒNG ${idx + 1}</div>
      ${gridHtml}
    `;
    container.appendChild(card);
  });
}

// Run Live Monte Carlo Simulation
async function runMonteCarloSimulation() {
  const spins = parseInt(dom.simSpinsSelect.value);
  const betPerLine = parseFloat(dom.simBetPerLine.value) || 1.0;
  const numLines = parseInt(dom.simNumLines.value) || 20;

  dom.simLoading.classList.remove("hidden");
  dom.btnRunSim.disabled = true;

  try {
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spins: spins,
        bet_per_line: betPerLine,
        num_lines: numLines,
      }),
    });
    const json = await res.json();

    if (json.status === "success") {
      const data = json.data;

      // Update Key Metrics
      dom.metricTotalRtp.textContent = `${data.total_rtp_percent.toFixed(2)}%`;
      dom.metricBaseRtp.textContent = `${data.base_game_rtp_percent.toFixed(2)}%`;
      dom.metricFreeRtp.textContent = `${data.free_spins_rtp_percent.toFixed(2)}%`;
      dom.metricHitFreq.textContent = `${data.hit_frequency_percent.toFixed(2)}%`;
      dom.metricFsRatio.textContent = data.free_spin_trigger_ratio;
      dom.metricVolatility.textContent = `Trung Bình (${data.standard_deviation.toFixed(2)})`;
      dom.metricMaxWin.textContent = `${data.max_win_multiplier.toFixed(2)}x`;
      dom.metricSpeed.textContent = `${data.spins_per_sec.toLocaleString()} / sec`;

      // Render Payout Distribution Bars
      dom.distributionBars.innerHTML = "";
      for (const [bracket, label] of Object.entries(data.distribution)) {
        // extract count and percent e.g. "50,804 (50.8%)"
        const pctMatch = label.match(/\(([\d.]+)%\)/);
        const pct = pctMatch ? parseFloat(pctMatch[1]) : 0;

        const row = document.createElement("div");
        row.className = "dist-bar-row";
        row.innerHTML = `
          <span class="dist-lbl">${bracket}</span>
          <div class="dist-bar-track">
            <div class="dist-bar-fill" style="width: ${pct}%"></div>
          </div>
          <span class="dist-val">${label}</span>
        `;
        dom.distributionBars.appendChild(row);
      }

      // Render Symbol RTP Contributions
      dom.symbolContributions.innerHTML = "";
      if (data.symbol_hits) {
        const sorted = Object.entries(data.symbol_hits).sort((a, b) => b[1] - a[1]).slice(0, 10);
        sorted.forEach(([sym, rtpVal]) => {
          const item = document.createElement("div");
          item.className = "contrib-item";
          const rawKey = sym.replace("_FREE", "").replace("_BASE", "");
          const meta = state.paytableData?.symbols_meta[rawKey] || { icon: "🎰", name_vi: rawKey };
          const isFree = sym.includes("_FREE");
          item.innerHTML = `
            <span class="contrib-name">${meta.icon} ${meta.name_vi} ${isFree ? '<small style="color:#ff9100;font-weight:bold;">(Free Spins)</small>' : ''}</span>
            <span class="contrib-rtp">${rtpVal.toFixed(2)}% RTP</span>
          `;
          dom.symbolContributions.appendChild(item);
        });
      }
    }
  } catch (err) {
    console.error("Simulation error:", err);
  } finally {
    dom.simLoading.classList.add("hidden");
    dom.btnRunSim.disabled = false;
  }
}

// Start application when DOM is ready
window.addEventListener("DOMContentLoaded", initApp);
