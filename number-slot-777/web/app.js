/**
 * Lucky Numbers 777 - Client Controller
 * Single Center Payline 5x3 Number Slot Machine with Multi-Betting Board
 */

const state = {
  session: null,
  rulesData: null,
  selectedChip: 10,
  placedBets: {}, // { [betKey]: amount }
  isSpinning: false,
  isAutoSpin: false,
  isTurbo: false,
  soundEnabled: true,
  audioCtx: null,
  soikeoMode: "taixiu", // "taixiu" | "chanle"
  soikeoLimit: 30,      // 30 | 50 | 100
  historyData: [],
  simCategoryFilter: "ALL",
  lastSimData: null,
  currentGrid: null,
};

// Web Audio API Synthesizer
const soundEngine = {
  init() {
    if (!state.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) state.audioCtx = new AudioCtx();
    }
  },

  playSpin() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, state.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, state.audioCtx.currentTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(60, state.audioCtx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.08, state.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, state.audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.start();
      osc.stop(state.audioCtx.currentTime + 0.35);
    } catch (e) {}
  },

  playChip() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, state.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, state.audioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.2, state.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, state.audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.start();
      osc.stop(state.audioCtx.currentTime + 0.04);
    } catch (e) {}
  },

  playReelStop() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      const osc = state.audioCtx.createOscillator();
      const gain = state.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, state.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, state.audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, state.audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, state.audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.start();
      osc.stop(state.audioCtx.currentTime + 0.08);
    } catch (e) {}
  },

  playWin() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = state.audioCtx.createOscillator();
        const gain = state.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.2, state.audioCtx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + idx * 0.07 + 0.3);
        osc.connect(gain);
        gain.connect(state.audioCtx.destination);
        osc.start(state.audioCtx.currentTime + idx * 0.07);
        osc.stop(state.audioCtx.currentTime + idx * 0.07 + 0.3);
      });
    } catch (e) {}
  },

  playBigWin() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
      const fanfare = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      fanfare.forEach((freq, idx) => {
        const osc = state.audioCtx.createOscillator();
        const gain = state.audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.18, state.audioCtx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + idx * 0.09 + 0.4);
        osc.connect(gain);
        gain.connect(state.audioCtx.destination);
        osc.start(state.audioCtx.currentTime + idx * 0.09);
        osc.stop(state.audioCtx.currentTime + idx * 0.09 + 0.4);
      });
    } catch (e) {}
  }
};

const dom = {
  // Navigation
  tabBtns: document.querySelectorAll(".tab-btn"),
  tabContents: document.querySelectorAll(".tab-content"),
  soundToggle: document.getElementById("soundToggle"),

  // Marquee
  resSum: document.getElementById("resSum"),
  resTaiXiu: document.getElementById("resTaiXiu"),
  resChanLe: document.getElementById("resChanLe"),
  resHand: document.getElementById("resHand"),

  // Meters
  meterBalance: document.getElementById("meterBalance"),
  meterTotalBet: document.getElementById("meterTotalBet"),
  meterWin: document.getElementById("meterWin"),

  // Action buttons
  btnClearBets: document.getElementById("btnClearBets"),
  btnDoubleBets: document.getElementById("btnDoubleBets"),
  btnTurbo: document.getElementById("btnTurbo"),
  btnAuto: document.getElementById("btnAuto"),
  btnSpin: document.getElementById("btnSpin"),
  btnResetBalance: document.getElementById("btnResetBalance"),

  // Reels & Popups
  reelsContainer: document.getElementById("reelsContainer"),
  winBanner: document.getElementById("winBanner"),
  winBannerTitle: document.getElementById("winBannerTitle"),
  winBannerAmount: document.getElementById("winBannerAmount"),
  winBannerDesc: document.getElementById("winBannerDesc"),
  winPillsList: document.getElementById("winPillsList"),

  // Chips & Betting Cells
  betChips: document.querySelectorAll(".bet-chip"),
  betCells: document.querySelectorAll(".bet-cell"),

  // Mini Soi Kèo Bar (if present)
  miniBeadsContainer: document.getElementById("miniBeadsContainer"),
  btnOpenSoiKeoTab: document.getElementById("btnOpenSoiKeoTab"),

  // Direct Live Game Roadmap Panel (on Tab Game)
  liveStreakBadge: document.getElementById("liveStreakBadge"),
  livePctTai: document.getElementById("livePctTai"),
  liveCntTai: document.getElementById("liveCntTai"),
  livePctHoa: document.getElementById("livePctHoa"),
  liveCntHoa: document.getElementById("liveCntHoa"),
  livePctXiu: document.getElementById("livePctXiu"),
  liveCntXiu: document.getElementById("liveCntXiu"),
  btnLiveModeTaiXiu: document.getElementById("btnLiveModeTaiXiu"),
  btnLiveModeChanLe: document.getElementById("btnLiveModeChanLe"),
  btnOpenFullSoiKeo: document.getElementById("btnOpenFullSoiKeo"),
  liveRoadStatus: document.getElementById("liveRoadStatus"),
  liveBeadTags: document.getElementById("liveBeadTags"),
  liveBeadContainer: document.getElementById("liveBeadContainer"),
  liveBigRoadContainer: document.getElementById("liveBigRoadContainer"),

  // VIP Soi Kèo Tab Controls & Scoreboard
  btnFilterTaiXiu: document.getElementById("btnFilterTaiXiu"),
  btnFilterChanLe: document.getElementById("btnFilterChanLe"),
  limitBtns: document.querySelectorAll(".limit-btn"),

  // VIP Scoreboard Trio
  lblPctTai: document.getElementById("lblPctTai"),
  lblCntTai: document.getElementById("lblCntTai"),
  lblPctHoa: document.getElementById("lblPctHoa"),
  lblCntHoa: document.getElementById("lblCntHoa"),
  lblPctXiu: document.getElementById("lblPctXiu"),
  lblCntXiu: document.getElementById("lblCntXiu"),

  // VIP Multi-Color Ratio Strip
  barSegTai: document.getElementById("barSegTai"),
  barTxtTai: document.getElementById("barTxtTai"),
  barSegHoa: document.getElementById("barSegHoa"),
  barTxtHoa: document.getElementById("barTxtHoa"),
  barSegXiu: document.getElementById("barSegXiu"),
  barTxtXiu: document.getElementById("barTxtXiu"),

  // Streak Banner Row
  currentStreakBadge: document.getElementById("currentStreakBadge"),
  maxStreakVal: document.getElementById("maxStreakVal"),
  lblPctChan: document.getElementById("lblPctChan"),
  lblPctLe: document.getElementById("lblPctLe"),

  cntThung: document.getElementById("cntThung"),
  cntSanh: document.getElementById("cntSanh"),
  cntPoker: document.getElementById("cntPoker"),

  // VIP Road Maps
  beadPlateContainer: document.getElementById("beadPlateContainer"),
  bigRoadContainer: document.getElementById("bigRoadContainer"),
  bigRoadStatus: document.getElementById("bigRoadStatus"),
  beadPlateTags: document.getElementById("beadPlateTags"),

  // Chart
  sumTrendCanvas: document.getElementById("sumTrendCanvas"),

  // Numbers Freq
  numbersFreqGrid: document.getElementById("numbersFreqGrid"),

  // History Table
  soikeoTableBody: document.getElementById("soikeoTableBody"),

  // Pro Math Simulator DOM references
  simSpinsSelect: document.getElementById("simSpinsSelect"),
  btnRunSim: document.getElementById("btnRunSim"),
  simLoading: document.getElementById("simLoading"),
  simResults: document.getElementById("simResults"),
  simKpiRtp: document.getElementById("simKpiRtp"),
  simKpiTargetRtp: document.getElementById("simKpiTargetRtp"),
  simKpiDelta: document.getElementById("simKpiDelta"),
  simKpiHitFreq: document.getElementById("simKpiHitFreq"),
  simKpiHitRatio: document.getElementById("simKpiHitRatio"),
  simKpiMaxWin: document.getElementById("simKpiMaxWin"),
  simKpiStdDev: document.getElementById("simKpiStdDev"),
  simKpiVolClass: document.getElementById("simKpiVolClass"),
  simKpiCi95: document.getElementById("simKpiCi95"),
  simKpiSpeed: document.getElementById("simKpiSpeed"),
  simKpiElapsed: document.getElementById("simKpiElapsed"),
  simKpiSpins: document.getElementById("simKpiSpins"),
  simDistGrid: document.getElementById("simDistGrid"),
  simTableFilterGroup: document.getElementById("simTableFilterGroup"),
  simContributionsTableBody: document.getElementById("simContributionsTableBody"),
  simSymbolsGrid: document.getElementById("simSymbolsGrid"),
  simSumBarsWrapper: document.getElementById("simSumBarsWrapper"),
};

// Colors mapping
const NUMBER_COLORS = {
  1: "#00E5FF", 2: "#76FF03", 3: "#FF9100", 4: "#2979FF", 5: "#D500F9",
  6: "#FFD600", 7: "#FF1744", 8: "#00E676", 9: "#FF3D00"
};

async function init() {
  setupNavigation();
  setupBettingBoard();
  setupActions();
  setupSoiKeoControls();
  await loadSession();
  renderInitialReels();
}

function setupNavigation() {
  dom.tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      dom.tabBtns.forEach(b => b.classList.remove("active"));
      dom.tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const target = `tab-${btn.dataset.tab}`;
      document.getElementById(target)?.classList.add("active");
      if (btn.dataset.tab === "soikeo") {
        setTimeout(renderSoiKeo, 50);
      } else if (btn.dataset.tab === "simulator") {
        if (!state.lastSimData) {
          setTimeout(runSimulation, 50);
        }
      }
    });
  });

  dom.soundToggle.addEventListener("click", () => {
    soundEngine.init();
    state.soundEnabled = !state.soundEnabled;
    dom.soundToggle.textContent = state.soundEnabled ? "🔊" : "🔇";
    dom.soundToggle.style.opacity = state.soundEnabled ? "1" : "0.5";
  });
}

function renderInitialReels() {
  const initialGrid = [
    [3, 8, 1, 6, 2],
    [7, 7, 7, 8, 9], // Center line row 1
    [4, 5, 2, 9, 3]
  ];
  state.currentGrid = initialGrid;
  for (let c = 0; c < 5; c++) {
    renderReelStatic(c, [initialGrid[0][c], initialGrid[1][c], initialGrid[2][c]]);
  }
}

function renderReelStatic(colIdx, nums3) {
  const strip = document.getElementById(`reel-${colIdx}`);
  if (!strip) return;
  strip.style.transition = "none";
  strip.style.transform = "translateY(0px)";
  strip.classList.remove("strip-rolling");
  strip.innerHTML = "";
  for (let r = 0; r < 3; r++) {
    const num = nums3[r];
    const color = NUMBER_COLORS[num] || "#fff";
    const cell = document.createElement("div");
    cell.className = `num-cell-slot ${r === 0 ? "row-top" : (r === 1 ? "row-center" : "row-bottom")}`;
    cell.innerHTML = `<span class="slot-number-text" style="color:${color}">${num}</span>`;
    strip.appendChild(cell);
  }
}

async function loadSession() {
  try {
    const res = await fetch("/api/session");
    const json = await res.json();
    if (json.status === "success") {
      state.session = json.data;
      state.historyData = json.data.history || json.recent_history || [];
      updateMeters();
      renderSoiKeo();
    }
  } catch (err) {
    console.error(err);
  }
}

function updateMeters(lastWin = 0) {
  if (!state.session) return;
  dom.meterBalance.textContent = state.session.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalWager = Object.values(state.placedBets).reduce((acc, v) => acc + v, 0);
  dom.meterTotalBet.textContent = totalWager.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (lastWin > 0) {
    dom.meterWin.textContent = lastWin.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

function setupBettingBoard() {
  // Chip selection
  dom.betChips.forEach(chip => {
    chip.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      dom.betChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      state.selectedChip = parseInt(chip.dataset.val);
    });
  });

  // Betting cells click
  dom.betCells.forEach(cell => {
    cell.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      const betKey = cell.dataset.bet;
      state.placedBets[betKey] = (state.placedBets[betKey] || 0) + state.selectedChip;
      renderPlacedChips();
      updateMeters();
    });
  });
}

function renderPlacedChips() {
  dom.betCells.forEach(cell => {
    const betKey = cell.dataset.bet;
    const amt = state.placedBets[betKey] || 0;
    const chipBadge = document.getElementById(`chip-${betKey}`);
    if (amt > 0) {
      cell.classList.add("has-bet");
      if (chipBadge) {
        chipBadge.classList.remove("hidden");
        chipBadge.textContent = amt >= 1000 ? `${(amt/1000).toFixed(1)}K` : amt;
      }
    } else {
      cell.classList.remove("has-bet");
      if (chipBadge) chipBadge.classList.add("hidden");
    }
  });
}

function setupActions() {
  dom.btnClearBets.addEventListener("click", () => {
    soundEngine.init();
    soundEngine.playChip();
    state.placedBets = {};
    renderPlacedChips();
    updateMeters();
  });

  dom.btnDoubleBets.addEventListener("click", () => {
    soundEngine.init();
    soundEngine.playChip();
    for (const k in state.placedBets) {
      state.placedBets[k] *= 2;
    }
    renderPlacedChips();
    updateMeters();
  });

  dom.btnTurbo.addEventListener("click", () => {
    state.isTurbo = !state.isTurbo;
    dom.btnTurbo.classList.toggle("active", state.isTurbo);
    dom.btnTurbo.textContent = state.isTurbo ? "⚡ TURBO: BẬT" : "⚡ TURBO: TẮT";
  });

  dom.btnAuto.addEventListener("click", () => {
    state.isAutoSpin = !state.isAutoSpin;
    dom.btnAuto.classList.toggle("active", state.isAutoSpin);
    dom.btnAuto.textContent = state.isAutoSpin ? "🔄 AUTO (ON)" : "🔄 AUTO (OFF)";
    if (state.isAutoSpin && !state.isSpinning) triggerSpin();
  });

  dom.btnSpin.addEventListener("click", () => {
    soundEngine.init();
    if (!state.isSpinning) triggerSpin();
  });

  dom.btnResetBalance.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initial_balance: 10000.0 })
      });
      const json = await res.json();
      if (json.status === "success") {
        state.session = json.data;
        state.historyData = json.data.history || [];
        updateMeters();
        renderSoiKeo();
      }
    } catch (e) {
      console.error(e);
    }
  });

  dom.btnRunSim.addEventListener("click", runSimulation);
}

async function triggerSpin() {
  if (state.isSpinning) return;

  // If no bets placed, default to BASE_SPIN: 10
  if (Object.keys(state.placedBets).length === 0) {
    state.placedBets["BASE_SPIN"] = 10.0;
    renderPlacedChips();
  }

  const totalBet = Object.values(state.placedBets).reduce((acc, v) => acc + v, 0);
  if (state.session && state.session.balance < totalBet) {
    alert("Số dư của bạn không đủ cho tổng cược!");
    state.isAutoSpin = false;
    dom.btnAuto.classList.remove("active");
    dom.btnAuto.textContent = "🔄 AUTO (OFF)";
    return;
  }

  state.isSpinning = true;
  dom.btnSpin.disabled = true;
  dom.winBanner.classList.remove("show");
  dom.winPillsList.innerHTML = "";
  dom.resHand.textContent = "ĐANG QUAY CUỘN...";

  soundEngine.init();
  soundEngine.playSpin();

  try {
    const res = await fetch("/api/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bets: state.placedBets })
    });
    const json = await res.json();

    if (json.status !== "success") {
      throw new Error(json.detail || "Spin error");
    }

    const { session, grid, center_row, analysis, payout } = json.data;
    state.session = session;

    // Previous 3 rows grid
    const prevGrid = state.currentGrid || [
      [3, 8, 1, 6, 2],
      [7, 7, 7, 8, 9],
      [4, 5, 2, 9, 3]
    ];

    // Build independent cascading roll for all 5 reels
    const reelPromises = [];

    for (let c = 0; c < 5; c++) {
      const p = new Promise(resolve => {
        const strip = document.getElementById(`reel-${c}`);
        if (!strip) return resolve();

        const targetNums = [grid[0][c], grid[1][c], grid[2][c]];
        const prevNums = [prevGrid[0][c], prevGrid[1][c], prevGrid[2][c]];

        // Staggered intermediate roll count for authentic progressive reel stops
        const numIntermediates = state.isTurbo ? (10 + c * 3) : (18 + c * 6);
        const totalItems = 3 + numIntermediates + 3;

        // Assembly: [target[0], target[1], target[2], ...randoms..., prev[0], prev[1], prev[2]]
        const stripNums = [targetNums[0], targetNums[1], targetNums[2]];
        for (let i = 0; i < numIntermediates; i++) {
          stripNums.push((Math.random() * 9 | 0) + 1);
        }
        stripNums.push(prevNums[0], prevNums[1], prevNums[2]);

        // Render nodes
        strip.innerHTML = "";
        strip.style.transition = "none";
        const initialOffset = -((totalItems - 3) * 110);
        strip.style.transform = `translateY(${initialOffset}px)`;

        stripNums.forEach((num, idx) => {
          const color = NUMBER_COLORS[num] || "#fff";
          const cell = document.createElement("div");

          let rowClass = "row-top";
          if (idx === 1) rowClass = "row-center";
          else if (idx === 2) rowClass = "row-bottom";
          else if (idx === totalItems - 2) rowClass = "row-center";
          else if (idx === totalItems - 1) rowClass = "row-bottom";

          cell.className = `num-cell-slot ${rowClass}`;
          cell.innerHTML = `<span class="slot-number-text" style="color:${color}">${num}</span>`;
          strip.appendChild(cell);
        });

        // Compute duration with staggered interval
        const duration = state.isTurbo ? (0.32 + c * 0.10) : (0.75 + c * 0.22);

        // Force browser layout repaint
        void strip.offsetHeight;

        strip.classList.add("strip-rolling");
        strip.style.transition = `transform ${duration}s cubic-bezier(0.12, 0.95, 0.25, 1.08)`;
        strip.style.transform = "translateY(0px)";

        setTimeout(() => {
          strip.classList.remove("strip-rolling");
          soundEngine.playReelStop();
          renderReelStatic(c, targetNums);
          resolve();
        }, duration * 1000);
      });

      reelPromises.push(p);
    }

    await Promise.all(reelPromises);

    // Save final grid as currentGrid for the next spin
    state.currentGrid = grid;

    // Process & Display results
    handleResults(center_row, analysis, payout);

  } catch (err) {
    console.error("Spin error:", err);
    for (let c = 0; c < 5; c++) {
      const strip = document.getElementById(`reel-${c}`);
      if (strip) {
        strip.classList.remove("strip-rolling");
        strip.style.transition = "none";
        strip.style.transform = "translateY(0px)";
      }
    }
  } finally {
    state.isSpinning = false;
    dom.btnSpin.disabled = false;
    updateMeters();

    if (state.isAutoSpin) {
      setTimeout(() => {
        if (state.isAutoSpin) triggerSpin();
      }, state.isTurbo ? 600 : 1500);
    }
  }
}

function handleResults(center_row, analysis, payout) {
  // Update Marquee Result
  dom.resSum.textContent = `Tổng: ${analysis.sum}`;
  dom.resTaiXiu.textContent = analysis.is_tai ? "TÀI (26-45)" : (analysis.is_xiu ? "XỈU (5-24)" : "HÒA (25)");
  dom.resChanLe.textContent = analysis.is_chan ? "CHẴN" : "LẺ";
  dom.resHand.textContent = `Dãy: [ ${center_row.join(" - ")} ] ➔ ${analysis.hand_title_vi}`;

  const totalWon = payout.total_won;
  updateMeters(totalWon);

  // Render winning pills
  if (payout.winning_items && payout.winning_items.length > 0) {
    payout.winning_items.forEach(item => {
      const pill = document.createElement("div");
      pill.className = "win-pill";
      pill.innerHTML = `
        <span>${item.reason_vi}:</span>
        <strong>+${item.win_amount.toFixed(2)}</strong> (x${item.multiplier})
      `;
      dom.winPillsList.appendChild(pill);
    });

    const totalBet = payout.total_bet;
    if (totalWon >= totalBet * 10) {
      dom.winBannerTitle.textContent = "JACKPOT / BIG WIN!";
      dom.winBannerAmount.textContent = `+${totalWon.toFixed(2)}`;
      dom.winBannerDesc.textContent = `${analysis.hand_title_vi} • Lãi ròng: +${payout.net_profit.toFixed(2)}`;
      dom.winBanner.classList.add("show");
      soundEngine.playBigWin();
    } else {
      soundEngine.playWin();
    }
  }

  // Record to historyData & update Soi Kèo real-time
  const newEntry = {
    spin: state.session ? state.session.total_spins : (state.historyData.length + 1),
    center_row: [...center_row],
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
    total_bet: payout.total_bet,
    total_won: totalWon,
    net: payout.net_profit
  };
  state.historyData.unshift(newEntry);
  if (state.historyData.length > 100) state.historyData.pop();
  renderSoiKeo();
}

async function runSimulation() {
  const spins = parseInt(dom.simSpinsSelect ? dom.simSpinsSelect.value : "20000") || 20000;
  if (dom.simLoading) dom.simLoading.classList.remove("hidden");
  if (dom.btnRunSim) dom.btnRunSim.disabled = true;

  try {
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spins })
    });
    const json = await res.json();
    if (json.status === "success") {
      state.lastSimData = json.data;
      renderSimulationResults(json.data);
    }
  } catch (err) {
    console.error("Simulation error:", err);
  } finally {
    if (dom.simLoading) dom.simLoading.classList.add("hidden");
    if (dom.btnRunSim) dom.btnRunSim.disabled = false;
  }
}

function renderSimulationResults(d) {
  if (!d) return;
  if (d.kpi) renderSimKPIs(d.kpi);
  if (d.payout_distribution) renderPayoutDistribution(d.payout_distribution, d.num_spins);
  if (d.bet_contributions) renderBetContributions(d.bet_contributions);
  if (d.symbol_breakdown) renderSymbolBreakdown(d.symbol_breakdown);
  if (d.sum_distribution) renderSumChart(d.sum_distribution, d.num_spins);
  setupSimulatorFilters();
}

function renderSimKPIs(kpi) {
  if (!kpi) return;
  if (dom.simKpiRtp) dom.simKpiRtp.textContent = `${kpi.base_rtp.toFixed(2)}%`;
  if (dom.simKpiTargetRtp) dom.simKpiTargetRtp.textContent = "95.00%";
  
  const delta = (kpi.base_rtp - 95.00);
  if (dom.simKpiDelta) {
    dom.simKpiDelta.textContent = `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`;
    dom.simKpiDelta.className = `kpi-delta ${delta >= 0 ? "pos" : "neg"}`;
  }

  if (dom.simKpiHitFreq) dom.simKpiHitFreq.textContent = `${kpi.base_hit_frequency.toFixed(2)}%`;
  if (dom.simKpiHitRatio) {
    const ratio = kpi.base_hit_frequency > 0 ? (100 / kpi.base_hit_frequency).toFixed(2) : "--";
    dom.simKpiHitRatio.textContent = ratio;
  }

  if (dom.simKpiMaxWin) dom.simKpiMaxWin.textContent = `x${kpi.max_win_multiplier.toFixed(1)}`;
  if (dom.simKpiStdDev) dom.simKpiStdDev.textContent = `σ = ${kpi.std_dev.toFixed(2)}`;
  if (dom.simKpiVolClass) dom.simKpiVolClass.textContent = kpi.volatility_class || "Trung Bình Cao";
  if (dom.simKpiCi95) dom.simKpiCi95.textContent = kpi.ci_95 || "[94.1% - 96.2%]";
  if (dom.simKpiSpeed) dom.simKpiSpeed.textContent = `${kpi.spins_per_sec.toLocaleString()} /s`;
  if (dom.simKpiElapsed) dom.simKpiElapsed.textContent = `${kpi.elapsed_sec}s`;
  if (dom.simKpiSpins) dom.simKpiSpins.textContent = `${kpi.num_spins.toLocaleString()}`;
}

function renderPayoutDistribution(brackets, numSpins) {
  if (!dom.simDistGrid || !brackets) return;
  dom.simDistGrid.innerHTML = "";

  brackets.forEach(b => {
    const card = document.createElement("div");
    card.className = "dist-card-pro";
    const barWidth = Math.min(100, Math.max(1, b.hit_rate_pct * 1.8));

    card.innerHTML = `
      <div class="dist-card-head">
        <span class="dist-badge-range" style="background:${b.color}22; color:${b.color}; border:1px solid ${b.color}66">${b.range}</span>
        <span class="dist-name">${b.bracket}</span>
      </div>
      <div class="dist-bar-track">
        <div class="dist-bar-fill" style="width:${barWidth}%; background:${b.color}"></div>
      </div>
      <div class="dist-stats-row">
        <span>Hits: <strong>${b.hits.toLocaleString()}</strong> (${b.hit_rate_pct.toFixed(2)}%)</span>
        <span>Đóng góp RTP: <strong style="color:${b.color}">+${b.rtp_contribution_pct.toFixed(2)}%</strong></span>
      </div>
    `;
    dom.simDistGrid.appendChild(card);
  });
}

function setupSimulatorFilters() {
  if (!dom.simTableFilterGroup) return;
  const btns = dom.simTableFilterGroup.querySelectorAll(".tbl-filter-btn");
  btns.forEach(btn => {
    btn.onclick = () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.simCategoryFilter = btn.dataset.category || "ALL";
      if (state.lastSimData && state.lastSimData.bet_contributions) {
        renderBetContributions(state.lastSimData.bet_contributions);
      }
    };
  });
}

function renderBetContributions(contributions) {
  if (!dom.simContributionsTableBody || !contributions) return;
  dom.simContributionsTableBody.innerHTML = "";

  const filter = state.simCategoryFilter || "ALL";
  const filtered = filter === "ALL" ? contributions : contributions.filter(c => c.category === filter);

  filtered.forEach(item => {
    const tr = document.createElement("tr");
    const delta = item.delta;
    const isPass = item.status === "PASSED";

    tr.innerHTML = `
      <td><strong>${item.name_vi}</strong> <span style="font-size:0.68rem;color:#718096">(${item.key})</span></td>
      <td><span class="cat-badge">${item.category}</span></td>
      <td><span style="font-family:var(--font-numbers);font-weight:800;color:var(--gold-primary)">${item.multiplier}</span></td>
      <td>${item.hits.toLocaleString()}</td>
      <td><strong>${item.hit_rate_pct.toFixed(2)}%</strong></td>
      <td><span style="font-family:var(--font-numbers);font-weight:800;color:${item.empirical_rtp >= item.target_rtp ? '#76ff03' : '#ff9100'}">${item.empirical_rtp.toFixed(2)}%</span></td>
      <td style="color:#a0aec0">${item.target_rtp.toFixed(2)}%</td>
      <td><span class="kpi-delta ${delta >= 0 ? 'pos' : 'neg'}">${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%</span></td>
      <td><span class="status-badge ${isPass ? 'passed' : 'monitor'}">${isPass ? '✓ ĐẠT GLI-19' : 'ĐANG THEO DÕI'}</span></td>
    `;
    dom.simContributionsTableBody.appendChild(tr);
  });
}

function renderSymbolBreakdown(symbols) {
  if (!dom.simSymbolsGrid || !symbols) return;
  dom.simSymbolsGrid.innerHTML = "";

  symbols.forEach(s => {
    const card = document.createElement("div");
    card.className = "symbol-stat-card";
    const color = NUMBER_COLORS[s.digit] || "#fff";

    const mb = s.matches_breakdown || {};
    const m1 = mb["1_match"] || 0;
    const m2 = mb["2_matches"] || 0;
    const m3 = mb["3_matches"] || 0;
    const m4 = mb["4_matches"] || 0;
    const m5 = mb["5_matches"] || 0;

    card.innerHTML = `
      <div class="symbol-card-top">
        <div class="symbol-card-left">
          <div class="symbol-big-digit" style="background:${color}22; color:${color}; border:2px solid ${color}; box-shadow:0 0 15px ${color}44">
            ${s.digit}
          </div>
          <div class="symbol-meta-col">
            <span class="symbol-meta-title">BIỂU TƯỢNG SỐ ${s.digit}</span>
            <span class="symbol-meta-sub">Tổng về: <strong style="color:#fff">${s.appearances.toLocaleString()}</strong> (${s.freq_pct.toFixed(2)}% vs kỳ vọng 11.11%)</span>
          </div>
        </div>
        <div class="symbol-rtp-box">
          <div class="symbol-rtp-lbl">RTP Cược Số</div>
          <div class="symbol-rtp-val">${s.bet_rtp.toFixed(2)}%</div>
        </div>
      </div>

      <div class="symbol-matches-list">
        <div class="match-box">
          <span class="match-lbl">1 TRÙNG</span>
          <span class="match-cnt">${m1.toLocaleString()}</span>
        </div>
        <div class="match-box">
          <span class="match-lbl">2 TRÙNG</span>
          <span class="match-cnt">${m2.toLocaleString()}</span>
        </div>
        <div class="match-box">
          <span class="match-lbl">3 TRÙNG</span>
          <span class="match-cnt">${m3.toLocaleString()}</span>
        </div>
        <div class="match-box">
          <span class="match-lbl">4 TRÙNG</span>
          <span class="match-cnt">${m4.toLocaleString()}</span>
        </div>
        <div class="match-box">
          <span class="match-lbl">5 TRÙNG</span>
          <span class="match-cnt glow-gold">${m5.toLocaleString()}</span>
        </div>
      </div>
    `;
    dom.simSymbolsGrid.appendChild(card);
  });
}

function renderSumChart(sumDistribution, numSpins) {
  if (!dom.simSumBarsWrapper || !sumDistribution) return;
  dom.simSumBarsWrapper.innerHTML = "";

  const maxPct = Math.max(...sumDistribution.map(d => d.percent), 0.001);

  sumDistribution.forEach(item => {
    const col = document.createElement("div");
    const isPeak = item.sum === 25;
    col.className = `sum-col ${isPeak ? "peak" : ""}`;

    const heightPct = Math.max(3, (item.percent / maxPct) * 100);

    col.innerHTML = `
      <div class="sum-bar" style="height:${heightPct}%" title="Tổng ${item.sum}: ${item.count.toLocaleString()} lần (${item.percent.toFixed(2)}%)"></div>
      <span class="sum-col-label">${item.sum}</span>
    `;
    dom.simSumBarsWrapper.appendChild(col);
  });
}

/* ========================================================
   BẢNG SOI KÈO CONTROLLERS & LOGIC
   ======================================================== */

function setupSoiKeoControls() {
  function switchToSoiKeoTab() {
    dom.tabBtns.forEach(b => b.classList.remove("active"));
    dom.tabContents.forEach(c => c.classList.remove("active"));
    const soikeoTabBtn = document.querySelector('.tab-btn[data-tab="soikeo"]');
    if (soikeoTabBtn) soikeoTabBtn.classList.add("active");
    const target = document.getElementById("tab-soikeo");
    if (target) {
      target.classList.add("active");
      setTimeout(() => {
        renderSoiKeo();
        drawSumTrendChart(getFilteredHistory());
      }, 50);
    }
  }

  if (dom.btnOpenSoiKeoTab) {
    dom.btnOpenSoiKeoTab.addEventListener("click", switchToSoiKeoTab);
  }

  if (dom.btnOpenFullSoiKeo) {
    dom.btnOpenFullSoiKeo.addEventListener("click", switchToSoiKeoTab);
  }

  function setSoiKeoMode(mode) {
    state.soikeoMode = mode;
    if (dom.btnFilterTaiXiu) dom.btnFilterTaiXiu.classList.toggle("active", mode === "taixiu");
    if (dom.btnFilterChanLe) dom.btnFilterChanLe.classList.toggle("active", mode === "chanle");
    if (dom.btnLiveModeTaiXiu) dom.btnLiveModeTaiXiu.classList.toggle("active", mode === "taixiu");
    if (dom.btnLiveModeChanLe) dom.btnLiveModeChanLe.classList.toggle("active", mode === "chanle");
    updateBeadPlateTags();
    renderSoiKeo();
  }

  if (dom.btnLiveModeTaiXiu) dom.btnLiveModeTaiXiu.addEventListener("click", () => setSoiKeoMode("taixiu"));
  if (dom.btnLiveModeChanLe) dom.btnLiveModeChanLe.addEventListener("click", () => setSoiKeoMode("chanle"));
  if (dom.btnFilterTaiXiu) dom.btnFilterTaiXiu.addEventListener("click", () => setSoiKeoMode("taixiu"));
  if (dom.btnFilterChanLe) dom.btnFilterChanLe.addEventListener("click", () => setSoiKeoMode("chanle"));

  dom.limitBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      dom.limitBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.soikeoLimit = parseInt(btn.dataset.limit) || 30;
      renderSoiKeo();
    });
  });

  window.addEventListener("resize", () => {
    const activeTab = document.querySelector(".tab-content.active");
    if (activeTab && activeTab.id === "tab-soikeo") {
      drawSumTrendChart(getFilteredHistory());
    }
  });
}

function updateBeadPlateTags() {
  const mode = state.soikeoMode;
  const htmlTaiXiuLive = `
    <span class="gls-tag tai">T = Tài (26-45)</span>
    <span class="gls-tag xiu">X = Xỉu (5-24)</span>
    <span class="gls-tag hoa">H = Hòa (25)</span>
  `;
  const htmlChanLeLive = `
    <span class="gls-tag" style="background:rgba(224,64,251,0.2);color:#ea80fc;border:1px solid rgba(224,64,251,0.4)">C = Chẵn</span>
    <span class="gls-tag" style="background:rgba(255,145,0,0.2);color:#ffb74d;border:1px solid rgba(255,145,0,0.4)">L = Lẻ</span>
  `;

  if (dom.liveBeadTags) {
    dom.liveBeadTags.innerHTML = mode === "taixiu" ? htmlTaiXiuLive : htmlChanLeLive;
  }

  if (dom.beadPlateTags) {
    dom.beadPlateTags.innerHTML = mode === "taixiu" ? `
      <span class="vip-tag-tai">T = TÀI</span>
      <span class="vip-tag-xiu">X = XỈU</span>
      <span class="vip-tag-hoa">H = HÒA</span>
    ` : `
      <span class="vip-tag" style="background:rgba(224,64,251,0.2);color:#ea80fc;border:1px solid rgba(224,64,251,0.4);padding:3px 8px;border-radius:4px;font-size:0.72rem;font-weight:800">C = TỔNG CHẴN</span>
      <span class="vip-tag" style="background:rgba(255,145,0,0.2);color:#ffb74d;border:1px solid rgba(255,145,0,0.4);padding:3px 8px;border-radius:4px;font-size:0.72rem;font-weight:800">L = TỔNG LẺ</span>
    `;
  }
}

function getFilteredHistory() {
  return state.historyData.slice(0, state.soikeoLimit);
}

function renderSoiKeo() {
  renderMiniSoiKeoBar();
  const filtered = getFilteredHistory();
  if (!filtered || filtered.length === 0) return;

  renderSoiKeoKPIs(filtered);
  renderBeadPlate(filtered);
  renderBigRoad(filtered);
  drawSumTrendChart(filtered);
  renderHotColdNumbers(filtered);
  renderHistoryTable(filtered);
}

function renderMiniSoiKeoBar() {
  if (!dom.miniBeadsContainer) return;
  dom.miniBeadsContainer.innerHTML = "";

  const recent = state.historyData.slice(0, 18);
  recent.forEach(item => {
    const bead = document.createElement("div");
    let cls = "tai";
    let text = "T";
    if (item.is_hoa_25) { cls = "hoa"; text = "H"; }
    else if (item.is_xiu) { cls = "xiu"; text = "X"; }

    bead.className = `mini-bead ${cls}`;
    bead.textContent = `${text}:${item.sum}`;
    bead.title = `Phiên #${item.spin}: Tổng ${item.sum} (${item.is_tai ? "Tài" : (item.is_xiu ? "Xỉu" : "Hòa 25")})\nBấm để mở Bảng Soi Kèo`;
    bead.addEventListener("click", () => {
      if (dom.btnOpenSoiKeoTab) dom.btnOpenSoiKeoTab.click();
    });
    dom.miniBeadsContainer.appendChild(bead);
  });
}

function renderSoiKeoKPIs(data) {
  const n = data.length;
  if (dom.kpiTotalSpins) dom.kpiTotalSpins.textContent = `${n} Phiên gần nhất`;

  const taiCnt = data.filter(d => d.is_tai).length;
  const xiuCnt = data.filter(d => d.is_xiu).length;
  const hoaCnt = data.filter(d => d.is_hoa_25).length;

  const taiPct = (taiCnt / n * 100).toFixed(1);
  const xiuPct = (xiuCnt / n * 100).toFixed(1);
  const hoaPct = (hoaCnt / n * 100).toFixed(1);

  // Live Road KPI Pills on Tab Game
  if (dom.livePctTai) dom.livePctTai.textContent = `${taiPct}%`;
  if (dom.liveCntTai) dom.liveCntTai.textContent = taiCnt;
  if (dom.livePctHoa) dom.livePctHoa.textContent = `${hoaPct}%`;
  if (dom.liveCntHoa) dom.liveCntHoa.textContent = hoaCnt;
  if (dom.livePctXiu) dom.livePctXiu.textContent = `${xiuPct}%`;
  if (dom.liveCntXiu) dom.liveCntXiu.textContent = xiuCnt;

  // VIP Scoreboard Trio
  if (dom.lblPctTai) dom.lblPctTai.textContent = `${taiPct}%`;
  if (dom.lblCntTai) dom.lblCntTai.textContent = taiCnt;
  if (dom.lblPctHoa) dom.lblPctHoa.textContent = `${hoaPct}%`;
  if (dom.lblCntHoa) dom.lblCntHoa.textContent = hoaCnt;
  if (dom.lblPctXiu) dom.lblPctXiu.textContent = `${xiuPct}%`;
  if (dom.lblCntXiu) dom.lblCntXiu.textContent = xiuCnt;

  // Multi-Color Ratio Strip
  if (dom.barSegTai) dom.barSegTai.style.width = `${taiPct}%`;
  if (dom.barTxtTai) dom.barTxtTai.textContent = `TÀI ${taiPct}%`;
  if (dom.barSegHoa) dom.barSegHoa.style.width = `${hoaPct}%`;
  if (dom.barTxtHoa) dom.barTxtHoa.textContent = hoaCnt > 0 ? `HÒA ${hoaPct}%` : "";
  if (dom.barSegXiu) dom.barSegXiu.style.width = `${xiuPct}%`;
  if (dom.barTxtXiu) dom.barTxtXiu.textContent = `XỈU ${xiuPct}%`;

  // Chan / Le
  const chanCnt = data.filter(d => d.is_chan).length;
  const leCnt = data.filter(d => d.is_le).length;
  const chanPct = (chanCnt / n * 100).toFixed(1);
  const lePct = (leCnt / n * 100).toFixed(1);

  if (dom.lblPctChan) dom.lblPctChan.textContent = `${chanPct}%`;
  if (dom.lblPctLe) dom.lblPctLe.textContent = `${lePct}%`;

  // Streaks Calculation
  let currentStreak = 0;
  let currentOutcome = null;
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    let out = item.is_hoa_25 ? "hoa" : (item.is_tai ? "tai" : "xiu");
    if (i === 0) {
      currentOutcome = out;
      currentStreak = 1;
    } else if (out === currentOutcome) {
      currentStreak++;
    } else {
      break;
    }
  }

  let streakBadgeText = "";
  if (currentOutcome === "tai") {
    streakBadgeText = `🔴 BỆT TÀI: ${currentStreak} CÂY`;
  } else if (currentOutcome === "xiu") {
    streakBadgeText = `🔵 BỆT XỈU: ${currentStreak} CÂY`;
  } else {
    streakBadgeText = `🟡 HÒA 25: ${currentStreak} CÂY`;
  }

  if (dom.liveStreakBadge) {
    dom.liveStreakBadge.textContent = streakBadgeText;
    if (currentOutcome === "tai") {
      dom.liveStreakBadge.style.background = "linear-gradient(135deg, #d32f2f, #b71c1c)";
      dom.liveStreakBadge.style.boxShadow = "0 0 12px rgba(211, 47, 47, 0.6)";
    } else if (currentOutcome === "xiu") {
      dom.liveStreakBadge.style.background = "linear-gradient(135deg, #0288d1, #01579b)";
      dom.liveStreakBadge.style.boxShadow = "0 0 12px rgba(2, 136, 209, 0.6)";
    } else {
      dom.liveStreakBadge.style.background = "linear-gradient(135deg, #f57f17, #e65100)";
      dom.liveStreakBadge.style.boxShadow = "0 0 12px rgba(245, 127, 23, 0.6)";
    }
  }

  if (dom.currentStreakBadge) {
    dom.currentStreakBadge.textContent = streakBadgeText;
  }

  // Max streak in sample
  let maxStreak = 1;
  let curRun = 1;
  for (let i = 1; i < data.length; i++) {
    const prev = data[i-1].is_hoa_25 ? "hoa" : (data[i-1].is_tai ? "tai" : "xiu");
    const cur = data[i].is_hoa_25 ? "hoa" : (data[i].is_tai ? "tai" : "xiu");
    if (prev === cur && cur !== "hoa") {
      curRun++;
      if (curRun > maxStreak) maxStreak = curRun;
    } else {
      curRun = 1;
    }
  }
  if (dom.maxStreakVal) dom.maxStreakVal.textContent = `${maxStreak} Cây`;

  // Rare Hands
  const thungCnt = data.filter(d => d.is_thung).length;
  const sanhCnt = data.filter(d => d.is_sanh).length;
  const pokerCnt = data.filter(d => ["NGU_QUY", "TU_QUY", "CU_LU"].includes(d.best_hand_key) || (d.best_hand && (d.best_hand.includes("Quý") || d.best_hand.includes("Cù Lũ")))).length;

  if (dom.cntThung) dom.cntThung.textContent = thungCnt;
  if (dom.cntSanh) dom.cntSanh.textContent = sanhCnt;
  if (dom.cntPoker) dom.cntPoker.textContent = pokerCnt;
}

function renderBeadPlate(data) {
  const containers = [dom.liveBeadContainer, dom.beadPlateContainer].filter(Boolean);
  if (containers.length === 0) return;

  containers.forEach(c => c.innerHTML = "");

  const chrono = [...data].reverse();
  const mode = state.soikeoMode;

  containers.forEach(container => {
    chrono.forEach(item => {
      const cell = document.createElement("div");
      let cls = "tai";
      let char = "T";

      if (mode === "taixiu") {
        if (item.is_hoa_25) { cls = "hoa"; char = "H"; }
        else if (item.is_tai) { cls = "tai"; char = "T"; }
        else { cls = "xiu"; char = "X"; }
      } else {
        if (item.is_chan) { cls = "chan"; char = "C"; }
        else { cls = "le"; char = "L"; }
      }

      cell.className = `bead-cell ${cls}`;
      cell.innerHTML = `
        <span class="bead-char">${char}</span>
        <span class="bead-num">${item.sum}</span>
      `;
      cell.title = `Phiên #${item.spin}\nDãy: [ ${item.center_row.join(" - ")} ]\nTổng: ${item.sum} (${item.is_tai ? "Tài" : (item.is_xiu ? "Xỉu" : "Hòa 25")})\n${item.best_hand}`;
      container.appendChild(cell);
    });

    container.scrollLeft = container.scrollWidth;
  });
}

function renderBigRoad(data) {
  const containers = [dom.liveBigRoadContainer, dom.bigRoadContainer].filter(Boolean);
  if (containers.length === 0) return;

  containers.forEach(c => c.innerHTML = "");

  const chrono = [...data].reverse();
  if (chrono.length === 0) return;

  const mode = state.soikeoMode;
  const columns = [];
  let currentCol = [];
  let lastOutcome = null;

  chrono.forEach(item => {
    let outcome = null;
    let char = "";
    let isTie = false;

    if (mode === "taixiu") {
      if (item.is_hoa_25) {
        isTie = true;
      } else if (item.is_tai) {
        outcome = "tai";
        char = "T";
      } else {
        outcome = "xiu";
        char = "X";
      }
    } else {
      if (item.is_chan) {
        outcome = "chan";
        char = "C";
      } else {
        outcome = "le";
        char = "L";
      }
    }

    if (isTie) {
      if (currentCol.length > 0) {
        currentCol[currentCol.length - 1].hasTie = true;
      }
      return;
    }

    if (lastOutcome === null) {
      lastOutcome = outcome;
      currentCol.push({ outcome, char, sum: item.sum, spin: item.spin, hasTie: false });
    } else if (outcome === lastOutcome) {
      currentCol.push({ outcome, char, sum: item.sum, spin: item.spin, hasTie: false });
    } else {
      columns.push(currentCol);
      currentCol = [{ outcome, char, sum: item.sum, spin: item.spin, hasTie: false }];
      lastOutcome = outcome;
    }
  });

  if (currentCol.length > 0) {
    columns.push(currentCol);
  }

  containers.forEach(container => {
    columns.forEach(col => {
      const colDiv = document.createElement("div");
      colDiv.className = "big-road-col";
      col.forEach(dot => {
        const dotDiv = document.createElement("div");
        dotDiv.className = `big-road-dot ${dot.outcome} ${dot.hasTie ? "tie-mark" : ""}`;
        dotDiv.textContent = dot.char;
        dotDiv.title = `Phiên #${dot.spin}: Tổng ${dot.sum} (${dot.outcome.toUpperCase()})${dot.hasTie ? " • Kèm Hòa 25" : ""}`;
        colDiv.appendChild(dotDiv);
      });
      container.appendChild(colDiv);
    });

    container.scrollLeft = container.scrollWidth;
  });

  if (columns.length > 0) {
    const last = columns[columns.length - 1];
    const outName = last[0].outcome === "tai" ? "TÀI" : (last[0].outcome === "xiu" ? "XỈU" : (last[0].outcome === "chan" ? "CHẴN" : "LẺ"));
    const color = (last[0].outcome === "tai" || last[0].outcome === "chan") ? "🔴" : "🔵";
    let statusMsg = "";
    let statusColor = "";
    if (last.length >= 3) {
      statusMsg = `${color} CẦU BỆT ${outName} (${last.length} CÂY)`;
      statusColor = "#ffd700";
    } else if (columns.length >= 3 && columns[columns.length - 1].length === 1 && columns[columns.length - 2].length === 1) {
      statusMsg = `⚡ CẦU NHẢY 1-1 (${outName})`;
      statusColor = "#00e5ff";
    } else {
      statusMsg = `Nhịp: ${outName}`;
      statusColor = "#00e676";
    }

    [dom.liveRoadStatus, dom.bigRoadStatus].forEach(el => {
      if (el) {
        el.textContent = statusMsg;
        el.style.borderColor = statusColor;
        el.style.color = statusColor;
      }
    });
  }
}

function drawSumTrendChart(data) {
  const canvas = dom.sumTrendCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = rect.width > 0 ? rect.width : 900;
  const height = 200;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const paddingLeft = 40;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const minY = 5;
  const maxY = 45;
  const rangeY = maxY - minY;

  const getY = (val) => paddingTop + chartH - ((val - minY) / rangeY * chartH);

  // Background grid lines
  ctx.lineWidth = 1;
  const gridVals = [10, 20, 25, 30, 40];
  gridVals.forEach(v => {
    const y = getY(v);
    ctx.beginPath();
    if (v === 25) {
      ctx.strokeStyle = "rgba(255, 215, 0, 0.4)";
      ctx.setLineDash([6, 4]);
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.setLineDash([]);
    }
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    ctx.fillStyle = v === 25 ? "#ffd700" : "#718096";
    ctx.font = "bold 11px 'Be Vietnam Pro', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(v === 25 ? "25 (Hòa)" : v, paddingLeft - 8, y + 3);
  });
  ctx.setLineDash([]);

  const chrono = [...data].reverse();
  if (chrono.length < 2) return;

  const stepX = chartW / (chrono.length - 1);
  const getX = (idx) => paddingLeft + idx * stepX;

  // Area gradient fill
  const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartH);
  grad.addColorStop(0, "rgba(255, 23, 68, 0.18)");
  grad.addColorStop(0.5, "rgba(255, 215, 0, 0.05)");
  grad.addColorStop(1, "rgba(0, 229, 255, 0.18)");

  ctx.beginPath();
  ctx.moveTo(getX(0), getY(chrono[0].sum));
  for (let i = 1; i < chrono.length; i++) {
    ctx.lineTo(getX(i), getY(chrono[i].sum));
  }
  ctx.lineTo(getX(chrono.length - 1), getY(25));
  ctx.lineTo(getX(0), getY(25));
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Stroke line
  ctx.beginPath();
  ctx.moveTo(getX(0), getY(chrono[0].sum));
  for (let i = 1; i < chrono.length; i++) {
    ctx.lineTo(getX(i), getY(chrono[i].sum));
  }
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Nodes
  chrono.forEach((item, idx) => {
    const x = getX(idx);
    const y = getY(item.sum);
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);

    let color = "#ffd700";
    if (item.sum > 25) color = "#ff1744";
    else if (item.sum < 25) color = "#00e5ff";

    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#07080d";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (chrono.length <= 35) {
      ctx.fillStyle = color;
      ctx.font = "bold 10px Montserrat, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.sum, x, y - 8);
    }
  });
}

function renderHotColdNumbers(data) {
  if (!dom.numbersFreqGrid) return;
  dom.numbersFreqGrid.innerHTML = "";

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  let totalOccurrences = 0;

  data.forEach(item => {
    if (item.center_row) {
      item.center_row.forEach(n => {
        if (counts[n] !== undefined) {
          counts[n]++;
          totalOccurrences++;
        }
      });
    }
  });

  const sortedNums = Object.keys(counts).map(n => ({ num: parseInt(n), count: counts[n] })).sort((a,b) => b.count - a.count);
  const maxCount = sortedNums[0].count;
  const minCount = sortedNums[sortedNums.length - 1].count;

  for (let d = 1; d <= 9; d++) {
    const cnt = counts[d];
    const pct = totalOccurrences > 0 ? (cnt / totalOccurrences * 100).toFixed(1) : 0;
    const isHot = cnt === maxCount && cnt > 0;
    const isCold = cnt === minCount;
    const color = NUMBER_COLORS[d] || "#fff";

    const card = document.createElement("div");
    card.className = `num-freq-card ${isHot ? "is-hot" : (isCold ? "is-cold" : "")}`;
    card.innerHTML = `
      ${isHot ? '<span class="freq-badge hot">🔥 HOT</span>' : isCold ? '<span class="freq-badge cold">❄️ COLD</span>' : '<span style="height:17px"></span>'}
      <span class="num-freq-digit" style="color: ${color}">${d}</span>
      <span class="num-freq-count">${cnt} lần</span>
      <span class="num-freq-pct">${pct}%</span>
      <div class="num-freq-bar-wrap">
        <div class="num-freq-bar-fill" style="width: ${Math.min(100, (cnt / (totalOccurrences / 9 * 2) * 100))}%; background: ${color}"></div>
      </div>
      <button class="num-freq-btn" data-num="${d}">+ CƯỢC SỐ ${d}</button>
    `;

    const btn = card.querySelector(".num-freq-btn");
    btn.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      const betKey = `SO_${d}`;
      state.placedBets[betKey] = (state.placedBets[betKey] || 0) + state.selectedChip;
      renderPlacedChips();
      updateMeters();

      dom.tabBtns.forEach(b => b.classList.remove("active"));
      dom.tabContents.forEach(c => c.classList.remove("active"));
      const gameTabBtn = document.querySelector('.tab-btn[data-tab="game"]');
      if (gameTabBtn) gameTabBtn.classList.add("active");
      const target = document.getElementById("tab-game");
      if (target) target.classList.add("active");
    });

    dom.numbersFreqGrid.appendChild(card);
  }
}

function renderHistoryTable(data) {
  if (!dom.soikeoTableBody) return;
  dom.soikeoTableBody.innerHTML = "";

  data.forEach(item => {
    const tr = document.createElement("tr");

    const rowNums = item.center_row.map(n => {
      const color = NUMBER_COLORS[n] || "#fff";
      return `<span class="mini-digit" style="color:${color};border:1px solid ${color}">${n}</span>`;
    }).join("");

    const taiXiuTag = item.is_hoa_25
      ? '<span class="tbl-tag hoa">Hòa 25</span>'
      : (item.is_tai ? '<span class="tbl-tag tai">Tài</span>' : '<span class="tbl-tag xiu">Xỉu</span>');

    const chanLeTag = item.is_chan
      ? '<span class="tbl-tag chan">Chẵn</span>'
      : '<span class="tbl-tag le">Lẻ</span>';

    const profit = item.net !== undefined ? item.net : 0;
    const profitHtml = profit > 0
      ? `<strong class="glow-gold">+${profit.toFixed(2)}</strong>`
      : (item.total_bet > 0 ? `<span style="color:#ff1744">-${item.total_bet.toFixed(2)}</span>` : '<span style="color:#718096">--</span>');

    tr.innerHTML = `
      <td style="font-weight:700;color:var(--gold-primary)">#${item.spin}</td>
      <td><div class="nums-row-badge">${rowNums}</div></td>
      <td style="font-weight:800;font-size:0.9rem">${item.sum}</td>
      <td>${taiXiuTag}</td>
      <td>${chanLeTag}</td>
      <td><span style="color:#e2e8f0;font-weight:600">${item.best_hand}</span></td>
      <td>${profitHtml}</td>
    `;
    dom.soikeoTableBody.appendChild(tr);
  });
}

window.addEventListener("DOMContentLoaded", init);
