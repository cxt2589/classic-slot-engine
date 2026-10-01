/**
 * Lucky Numbers 777 - Client Controller
 * Single Center Payline 5x3 Number Slot Machine with Multi-Betting Board
 */

const state = {
  session: null,
  rulesData: null,
  selectedChip: 10,
  placedBets: {}, // { [betKey]: amount }
  betInteractionMode: "add", // "add" | "sub" | "del"
  betHistoryStack: [],
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
  adminData: null,
  maxBets: {
    SANH_CHUAN: 20,
    NGU_QUY: 20,
    TU_QUY: 100,
    CU_LU: 200,
    DEFAULT: 5000
  },
  toastTimer: null,
  fortuneBetMode: "free", // "free" | "fortune"
  fortuneLockedNumbers: [],

  // Live Multiplayer Room & Social Suite
  gamePlayMode: "solo", // "solo" | "live"
  liveRoundData: null,
  liveLocalTimeLeft: 30,
  livePollInterval: null,
  liveCountdownInterval: null,
  liveLastSpunRoundId: null,
  liveLastAutoBetRoundId: null,
  liveUserBetPlaced: false,
  lastShareSlip: null,
  chatMessagesCache: [],
  activeRedPacketIdsSpawned: new Set(),
  lastSeenJackpotId: null
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
  },

  playWinTone() {
    this.playWin();
  }
};

// Telegram WebApp Engine & Haptic Controller
const telegramEngine = {
  tg: window.Telegram?.WebApp || null,

  init() {
    if (!this.tg) {
      console.log("[TelegramEngine] Running in standard Web Browser");
      return;
    }
    console.log("[TelegramEngine] Telegram WebApp detected", this.tg);
    try {
      this.tg.ready();
      this.tg.expand();
      if (typeof this.tg.enableClosingConfirmation === "function") {
        this.tg.enableClosingConfirmation();
      }
      if (typeof this.tg.setHeaderColor === "function") {
        this.tg.setHeaderColor("#07080d");
      }
      if (typeof this.tg.setBackgroundColor === "function") {
        this.tg.setBackgroundColor("#07080d");
      }
      document.body.classList.add("is-telegram-app");

      // Telegram User profile display
      const user = this.tg.initDataUnsafe?.user;
      if (user) {
        if (dom.tgUserPill) dom.tgUserPill.style.display = "flex";
        if (dom.tgUserName) {
          const displayName = user.username ? `@${user.username}` : (user.first_name || "Thành viên");
          dom.tgUserName.textContent = displayName;
        }
        if (dom.tgUserAvatar) {
          dom.tgUserAvatar.textContent = user.photo_url ? "⭐️" : "👤";
        }
      }

      if (dom.tgShareBtn) {
        dom.tgShareBtn.style.display = "inline-flex";
        dom.tgShareBtn.addEventListener("click", () => {
          this.haptic("light");
          const shareText = encodeURIComponent("🎰 Chơi Lucky Numbers 777 nhận ngay 10,000 Xu cùng mình nhé! Trúng thưởng x5000 cực đã!");
          const shareUrl = `https://t.me/share/url?url=https://t.me/relicspin_bot&text=${shareText}`;
          if (typeof this.tg.openTelegramLink === "function") {
            this.tg.openTelegramLink(shareUrl);
          } else {
            window.open(shareUrl, "_blank");
          }
        });
      }

      // Telegram BackButton integration
      if (this.tg.BackButton) {
        this.tg.BackButton.onClick(() => {
          this.haptic("light");
          switchTabTo("game");
        });
      }
    } catch (e) {
      console.warn("[TelegramEngine] Init warning:", e);
    }
  },

  updateBackButton(activeTab) {
    if (!this.tg?.BackButton) return;
    try {
      if (activeTab === "game") {
        this.tg.BackButton.hide();
      } else {
        this.tg.BackButton.show();
      }
    } catch (e) {}
  },

  haptic(type = "light") {
    if (!this.tg?.HapticFeedback) return;
    try {
      if (["light", "medium", "heavy", "rigid", "soft"].includes(type)) {
        this.tg.HapticFeedback.impactOccurred(type);
      } else if (["success", "warning", "error"].includes(type)) {
        this.tg.HapticFeedback.notificationOccurred(type);
      } else if (type === "selection") {
        this.tg.HapticFeedback.selectionChanged();
      }
    } catch (e) {}
  }
};

const dom = {
  // Navigation
  tabBtns: document.querySelectorAll(".tab-btn"),
  tabContents: document.querySelectorAll(".tab-content"),
  soundToggle: document.getElementById("soundToggle"),

  // Telegram Integration
  tgUserPill: document.getElementById("tgUserPill"),
  tgUserAvatar: document.getElementById("tgUserAvatar"),
  tgUserName: document.getElementById("tgUserName"),
  tgShareBtn: document.getElementById("tgShareBtn"),
  btnQuickTopUp: document.getElementById("btnQuickTopUp"),

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
  btnShareWinSlip: document.getElementById("btnShareWinSlip"),
  btnShareWinTelegram: document.getElementById("btnShareWinTelegram"),

  // Live Room Mode & Countdown
  globalMarqueeBanner: document.getElementById("globalMarqueeBanner"),
  marqueeText: document.getElementById("marqueeText"),
  btnModeSolo: document.getElementById("btnModeSolo"),
  btnModeLive: document.getElementById("btnModeLive"),
  modeLiveSecLbl: document.getElementById("modeLiveSecLbl"),
  liveRoomOnlinePill: document.getElementById("liveRoomOnlinePill"),
  liveOnlineCount: document.getElementById("liveOnlineCount"),
  liveRoundBanner: document.getElementById("liveRoundBanner"),
  liveRoundId: document.getElementById("liveRoundId"),
  livePhaseBadge: document.getElementById("livePhaseBadge"),
  livePhaseText: document.getElementById("livePhaseText"),
  liveTimerVal: document.getElementById("liveTimerVal"),
  liveProgressBar: document.getElementById("liveProgressBar"),
  liveRoundHint: document.getElementById("liveRoundHint"),
  liveBetStatus: document.getElementById("liveBetStatus"),
  commPlayerCount: document.getElementById("commPlayerCount"),
  commTotalWagered: document.getElementById("commTotalWagered"),
  btnInviteLiveRoom: document.getElementById("btnInviteLiveRoom"),

  // Live Chat, Social Suite & Drawer
  shareWinContainer: document.getElementById("shareWinContainer"),
  btnQuickShareWin: document.getElementById("btnQuickShareWin"),
  btnQuickShareTelegram: document.getElementById("btnQuickShareTelegram"),
  quickShareWinText: document.getElementById("quickShareWinText"),
  cabinetSocialBar: document.getElementById("cabinetSocialBar"),
  btnOpenChatDock: document.getElementById("btnOpenChatDock"),
  chatFloatingBadge: document.getElementById("chatFloatingBadge"),
  rxPillBtns: document.querySelectorAll(".rx-pill-btn"),

  // Floating Chat FAB & Drawer Modal
  btnFixedChatFab: document.getElementById("btnFixedChatFab"),
  chatFabBadge: document.getElementById("chatFabBadge"),
  chatDrawerBackdrop: document.getElementById("chatDrawerBackdrop"),
  chatDrawerPanel: document.getElementById("chatDrawerPanel"),
  btnCloseChatDrawer: document.getElementById("btnCloseChatDrawer"),
  drawerOnlineCount: document.getElementById("drawerOnlineCount"),
  floatingEmojisLayer: document.getElementById("floatingEmojisLayer"),
  chatMessagesContainer: document.getElementById("chatMessagesContainer"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
  btnSubmitChat: document.getElementById("btnSubmitChat"),
  cannedBtns: document.querySelectorAll(".canned-btn"),
  rxBtns: document.querySelectorAll(".rx-btn"),
  btnSendRedPacket: document.getElementById("btnSendRedPacket"),
  btnDrawerInvite: document.getElementById("btnDrawerInvite"),

  // Modal Phát Lộc Toàn Phòng
  modalSendRedPacket: document.getElementById("modalSendRedPacket"),
  btnCloseRedPacketModal: document.getElementById("btnCloseRedPacketModal"),
  btnCancelSendRedPacket: document.getElementById("btnCancelSendRedPacket"),
  btnConfirmSendRedPacket: document.getElementById("btnConfirmSendRedPacket"),
  rpModalBalanceVal: document.getElementById("rpModalBalanceVal"),
  inputCustomRedPacket: document.getElementById("inputCustomRedPacket"),
  rpPresetChips: document.querySelectorAll(".rp-preset-chip"),

  // Red Packet Rain & Global Alert Layer
  redPacketRainLayer: document.getElementById("redPacketRainLayer"),
  globalJackpotAlert: document.getElementById("globalJackpotAlert"),
  gjaDesc: document.getElementById("gjaDesc"),
  gjaAmt: document.getElementById("gjaAmt"),

  // Admin Live Room Config
  inputLiveBettingTime: document.getElementById("inputLiveBettingTime"),
  btnSaveLiveRoomConfig: document.getElementById("btnSaveLiveRoomConfig"),
  saveLiveRoomMsg: document.getElementById("saveLiveRoomMsg"),

  // Chips & Betting Cells
  betChips: document.querySelectorAll(".bet-chip"),
  betCells: document.querySelectorAll(".bet-cell"),
  btnModeAdd: document.getElementById("btnModeAdd"),
  btnModeSub: document.getElementById("btnModeSub"),
  btnModeDel: document.getElementById("btnModeDel"),
  btnUndoBet: document.getElementById("btnUndoBet"),
  btnBoardClearAll: document.getElementById("btnBoardClearAll"),
  btnBoardDouble: document.getElementById("btnBoardDouble"),

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
  telegramEngine.init();
  setupNavigation();
  setupBettingBoard();
  setupActions();
  setupSoiKeoControls();
  setupAdminControls();
  setupFortuneModeControls();
  setupLiveRoomControls();
  await loadSession();
  await loadAdminStatus(true); // silent fetch to load max bets
  renderInitialReels();
  startGlobalMarqueePolling();
  stopLivePolling(); // Khởi động polling nền (2.5s) ngay từ đầu để chế độ CÁ NHÂN vẫn nhận Mưa Lì Xì và thông báo toàn phòng!
}

function switchTabTo(tabKey) {
  dom.tabBtns.forEach(b => {
    b.classList.toggle("active", b.dataset.tab === tabKey);
  });
  dom.tabContents.forEach(c => {
    c.classList.toggle("active", c.id === `tab-${tabKey}`);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
  telegramEngine.haptic("selection");
  telegramEngine.updateBackButton(tabKey);

  if (tabKey === "soikeo") {
    setTimeout(renderSoiKeo, 50);
  } else if (tabKey === "simulator") {
    if (!state.lastSimData) {
      setTimeout(runSimulation, 50);
    }
  } else if (tabKey === "admin") {
    setTimeout(loadAdminStatus, 50);
  }
}

function setupNavigation() {
  dom.tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      switchTabTo(btn.dataset.tab);
    });
  });

  dom.soundToggle.addEventListener("click", () => {
    soundEngine.init();
    state.soundEnabled = !state.soundEnabled;
    dom.soundToggle.textContent = state.soundEnabled ? "🔊" : "🔇";
    dom.soundToggle.style.opacity = state.soundEnabled ? "1" : "0.5";
    telegramEngine.haptic("light");
  });

  setupStickyAndDockedNavigation();
}

function setupStickyAndDockedNavigation() {
  const topNav = document.getElementById("topNav");
  const mainNavTabs = document.getElementById("mainNavTabs");
  const navTabsWrapper = document.getElementById("navTabsWrapper");
  const appContainer = document.querySelector(".app-container");
  if (!topNav || !mainNavTabs) return;

  let ticking = false;
  let isDesktopSticky = false;
  let isMobileDocked = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
          // Reset desktop state if switched to mobile
          if (isDesktopSticky) {
            isDesktopSticky = false;
            topNav.classList.remove("is-sticky-desktop");
          }

          // Mobile mode with hysteresis:
          // Dock when scrolled down past 70px
          // Undock only when scrolled back up above 20px
          if (scrollY > 70 && !isMobileDocked) {
            isMobileDocked = true;
            mainNavTabs.classList.add("is-docked-bottom");
            appContainer?.classList.add("has-docked-nav");
            if (navTabsWrapper) {
              navTabsWrapper.style.minHeight = `${mainNavTabs.offsetHeight || 44}px`;
            }
          } else if (scrollY < 20 && isMobileDocked) {
            isMobileDocked = false;
            mainNavTabs.classList.remove("is-docked-bottom");
            appContainer?.classList.remove("has-docked-nav");
            if (navTabsWrapper) {
              navTabsWrapper.style.minHeight = "";
            }
          }
        } else {
          // Reset mobile state if switched to desktop
          if (isMobileDocked) {
            isMobileDocked = false;
            mainNavTabs.classList.remove("is-docked-bottom");
            appContainer?.classList.remove("has-docked-nav");
            if (navTabsWrapper) {
              navTabsWrapper.style.minHeight = "";
            }
          }

          // Desktop mode with hysteresis:
          // Activate sticky accent when scrolled past 60px
          // Remove sticky accent only when scrolled back up above 15px
          if (scrollY > 60 && !isDesktopSticky) {
            isDesktopSticky = true;
            topNav.classList.add("is-sticky-desktop");
          } else if (scrollY < 15 && isDesktopSticky) {
            isDesktopSticky = false;
            topNav.classList.remove("is-sticky-desktop");
          }
        }

        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
}

function renderInitialReels() {
  const initialGrid = [
    [6, 6, 6, 7, 8],
    [7, 7, 7, 8, 9], // Center line row 1
    [8, 8, 8, 9, 1]
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

      // Restore user-specific balance if in Telegram
      const tgUserId = telegramEngine.tg?.initDataUnsafe?.user?.id;
      if (tgUserId) {
        const saved = localStorage.getItem(`tg_balance_${tgUserId}`);
        if (saved !== null && !isNaN(parseFloat(saved))) {
          state.session.balance = parseFloat(saved);
        }
      }

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

  // Persist balance for Telegram user
  const tgUserId = telegramEngine.tg?.initDataUnsafe?.user?.id;
  if (tgUserId && state.session?.balance !== undefined) {
    localStorage.setItem(`tg_balance_${tgUserId}`, state.session.balance);
  }
}

function pushBetHistory() {
  state.betHistoryStack.push(JSON.stringify(state.placedBets));
  if (state.betHistoryStack.length > 30) state.betHistoryStack.shift();
}

function setupBettingBoard() {
  // Chip selection
  dom.betChips.forEach(chip => {
    chip.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("selection");
      dom.betChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      state.selectedChip = parseInt(chip.dataset.val);
    });
  });

  // Action Mode Buttons: ➕ ĐẶT THÊM, ➖ GIẢM CƯỢC, 🗑️ XÓA Ô NÀY
  const modeBtns = [dom.btnModeAdd, dom.btnModeSub, dom.btnModeDel].filter(Boolean);
  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("selection");
      modeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.betInteractionMode = btn.dataset.mode || "add";
    });
  });

  // Quick Board Actions: Undo, Clear All, Double
  if (dom.btnUndoBet) {
    dom.btnUndoBet.addEventListener("click", () => {
      if (state.betHistoryStack.length > 0) {
        soundEngine.init();
        soundEngine.playChip();
        telegramEngine.haptic("medium");
        state.placedBets = JSON.parse(state.betHistoryStack.pop());
        renderPlacedChips();
        updateMeters();
      }
    });
  }

  if (dom.btnBoardClearAll) {
    dom.btnBoardClearAll.addEventListener("click", () => {
      if (Object.keys(state.placedBets).length > 0) {
        pushBetHistory();
        soundEngine.init();
        soundEngine.playChip();
        telegramEngine.haptic("medium");
        state.placedBets = {};
        renderPlacedChips();
        updateMeters();
      }
    });
  }

  if (dom.btnBoardDouble) {
    dom.btnBoardDouble.addEventListener("click", () => {
      if (Object.keys(state.placedBets).length > 0) {
        pushBetHistory();
        soundEngine.init();
        soundEngine.playChip();
        telegramEngine.haptic("medium");
        for (const k in state.placedBets) {
          const limit = (state.maxBets && state.maxBets[k] !== undefined) ? state.maxBets[k] : (state.maxBets?.DEFAULT || 5000);
          state.placedBets[k] = Math.min(state.placedBets[k] * 2, limit);
        }
        renderPlacedChips();
        updateMeters();
      }
    });
  }

  // Betting cells click (Left Click)
  dom.betCells.forEach(cell => {
    cell.addEventListener("click", (e) => {
      const betKey = cell.dataset.bet;

      // If user clicked directly on the chip-remove-btn '✕'
      if (e.target && e.target.classList.contains("chip-remove-btn")) {
        e.stopPropagation();
        pushBetHistory();
        soundEngine.init();
        soundEngine.playChip();
        telegramEngine.haptic("medium");
        delete state.placedBets[betKey];
        renderPlacedChips();
        updateMeters();

        // Đồng bộ Chế Độ Khóa Thần Tài: Nếu bấm ✕ trên ô số, hủy luôn trạng thái ĐÃ CHỌN
        if (state.fortuneBetMode === "fortune" && cell.dataset.num) {
          const num = parseInt(cell.dataset.num);
          if (num && state.fortuneLockedNumbers.includes(num)) {
            state.fortuneLockedNumbers = state.fortuneLockedNumbers.filter(n => n !== num);
            renderFortuneLockState();
            showToast(`Đã xóa cược & bỏ chọn Số ${num}`, "cyan");
          }
        }
        return;
      }

      // If user clicked on the num-lock-pill '⚡ KHÓA'
      if (e.target && e.target.classList.contains("num-lock-pill")) {
        e.stopPropagation();
        const num = parseInt(cell.dataset.num);
        if (num) {
          toggleFortuneLockNumber(num);
        }
        return;
      }

      // Auto-lock number in Fortune Lock mode when betting on it
      if (state.fortuneBetMode === "fortune" && cell.dataset.num) {
        const num = parseInt(cell.dataset.num);
        if (num && !state.fortuneLockedNumbers.includes(num)) {
          if (state.fortuneLockedNumbers.length < 5) {
            state.fortuneLockedNumbers.push(num);
            state.fortuneLockedNumbers.sort((a, b) => a - b);
            renderFortuneLockState();
          }
        }
      }

      pushBetHistory();
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("light");

      const limit = (state.maxBets && state.maxBets[betKey] !== undefined) ? state.maxBets[betKey] : (state.maxBets?.DEFAULT || 5000);

      if (state.betInteractionMode === "add") {
        const cur = state.placedBets[betKey] || 0;
        if (cur >= limit) {
          telegramEngine.haptic("warning");
          const doorName = betKey === "SANH_CHUAN" ? "Sảnh Chuẩn" : (betKey === "NGU_QUY" ? "Ngũ Quý" : betKey);
          showToast(`⚠️ [${doorName}] giới hạn cược tối đa ${limit} Xu!`, true);
          return;
        }
        const next = Math.min(cur + state.selectedChip, limit);
        if (next === limit && cur + state.selectedChip > limit) {
          showToast(`⚡ Tự động căn chỉnh về mức cược tối đa: ${limit} Xu`);
        }
        state.placedBets[betKey] = next;
      } else if (state.betInteractionMode === "sub") {
        const cur = state.placedBets[betKey] || 0;
        const next = cur - state.selectedChip;
        if (next <= 0) {
          delete state.placedBets[betKey];
        } else {
          state.placedBets[betKey] = next;
        }
      } else if (state.betInteractionMode === "del") {
        delete state.placedBets[betKey];
        if (state.fortuneBetMode === "fortune" && cell.dataset.num) {
          const num = parseInt(cell.dataset.num);
          if (num && state.fortuneLockedNumbers.includes(num)) {
            state.fortuneLockedNumbers = state.fortuneLockedNumbers.filter(n => n !== num);
            renderFortuneLockState();
          }
        }
      }

      renderPlacedChips();
      updateMeters();
    });

    // Right-Click (ContextMenu) on bet cell to quickly decrease bet!
    cell.addEventListener("contextmenu", (e) => {
      e.preventDefault(); // Prevent native browser right-click menu
      const betKey = cell.dataset.bet;
      if (!state.placedBets[betKey]) return;

      pushBetHistory();
      soundEngine.init();
      soundEngine.playChip();

      const cur = state.placedBets[betKey] || 0;
      const next = cur - state.selectedChip;
      if (next <= 0) {
        delete state.placedBets[betKey];
      } else {
        state.placedBets[betKey] = next;
      }

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
        chipBadge.innerHTML = `
          <span>${amt >= 1000 ? `${(amt/1000).toFixed(1)}K` : amt}</span>
          <span class="chip-remove-btn" title="Xóa cược ô này">✕</span>
        `;
      }
    } else {
      cell.classList.remove("has-bet");
      if (chipBadge) {
        chipBadge.classList.add("hidden");
        chipBadge.innerHTML = "0";
      }
    }
  });
}

function setupActions() {
  dom.btnClearBets.addEventListener("click", () => {
    if (Object.keys(state.placedBets).length > 0) {
      pushBetHistory();
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("medium");
      state.placedBets = {};
      renderPlacedChips();
      updateMeters();
    }
  });

  dom.btnDoubleBets.addEventListener("click", () => {
    if (Object.keys(state.placedBets).length > 0) {
      pushBetHistory();
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("medium");
      for (const k in state.placedBets) {
        const limit = (state.maxBets && state.maxBets[k] !== undefined) ? state.maxBets[k] : (state.maxBets?.DEFAULT || 5000);
        state.placedBets[k] = Math.min(state.placedBets[k] * 2, limit);
      }
      renderPlacedChips();
      updateMeters();
    }
  });

  dom.btnTurbo.addEventListener("click", () => {
    state.isTurbo = !state.isTurbo;
    telegramEngine.haptic("medium");
    dom.btnTurbo.classList.toggle("active", state.isTurbo);
    dom.btnTurbo.textContent = state.isTurbo ? "⚡ TURBO: BẬT" : "⚡ TURBO: TẮT";
  });

  dom.btnAuto.addEventListener("click", () => {
    state.isAutoSpin = !state.isAutoSpin;
    telegramEngine.haptic("medium");
    dom.btnAuto.classList.toggle("active", state.isAutoSpin);
    dom.btnAuto.textContent = state.isAutoSpin ? "🔄 AUTO (ON)" : "🔄 AUTO (OFF)";

    if (state.isAutoSpin) {
      if (state.gamePlayMode === "live") {
        showToast("🤖 Đã BẬT Tự Động Cược theo từng phiên trực tiếp!", "gold");
        // Nếu phiên hiện tại đang mở cược và chưa đặt cược, tự động cược ngay
        if (state.liveRoundData && state.liveRoundData.phase === "betting" && state.liveLastAutoBetRoundId !== state.liveRoundData.round_id) {
          state.liveLastAutoBetRoundId = state.liveRoundData.round_id;
          placeLiveBetAction();
        }
      } else {
        if (!state.isSpinning) triggerSpin();
      }
    } else {
      if (state.gamePlayMode === "live") {
        showToast("⏹️ Đã TẮT Tự Động Cược nhóm", "info");
      }
    }
  });

  dom.btnSpin.addEventListener("click", () => {
    soundEngine.init();
    telegramEngine.haptic("heavy");
    if (!state.isSpinning) triggerSpin();
  });

  if (dom.btnQuickTopUp) {
    dom.btnQuickTopUp.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playWin();
      telegramEngine.haptic("success");
      if (state.session) {
        state.session.balance += 10000.0;
        updateMeters();
      }
    });
  }

  dom.btnResetBalance.addEventListener("click", async () => {
    try {
      telegramEngine.haptic("medium");
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

  if (dom.winBanner) {
    dom.winBanner.addEventListener("click", () => {
      dom.winBanner.classList.remove("show");
      dom.winBanner.style.display = "none";
    });
  }
}

async function triggerSpin() {
  if (state.gamePlayMode === "live") {
    await placeLiveBetAction();
    return;
  }

  if (state.isSpinning) return;
  if (dom.shareWinContainer) dom.shareWinContainer.style.display = "none";

  // If no bets placed, default to BASE_SPIN: 10
  if (Object.keys(state.placedBets).length === 0) {
    state.placedBets["BASE_SPIN"] = 10.0;
    renderPlacedChips();
  }

  const totalBet = Object.values(state.placedBets).reduce((acc, v) => acc + v, 0);
  if (state.session && state.session.balance < totalBet) {
    telegramEngine.haptic("error");
    alert("Số dư của bạn không đủ cho tổng cược!");
    state.isAutoSpin = false;
    dom.btnAuto.classList.remove("active");
    dom.btnAuto.textContent = "🔄 AUTO (OFF)";
    return;
  }

  state.isSpinning = true;
  dom.btnSpin.disabled = true;
  if (state.winBannerTimer) {
    clearTimeout(state.winBannerTimer);
    state.winBannerTimer = null;
  }
  if (dom.winBanner) {
    dom.winBanner.classList.remove("show");
    dom.winBanner.style.display = "none";
  }
  clearWinningHighlights();
  dom.winPillsList.innerHTML = "";
  dom.resHand.textContent = "ĐANG QUAY CUỘN...";

  soundEngine.init();
  soundEngine.playSpin();

  try {
    const res = await fetch("/api/spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bets: state.placedBets,
        bet_mode: state.fortuneBetMode === "fortune" ? "fortune_lock" : "free",
        locked_numbers: state.fortuneLockedNumbers
      })
    });
    const json = await res.json();

    if (json.status !== "success") {
      throw new Error(json.detail || "Spin error");
    }

    const { session, grid, center_row, analysis, payout, admin_info } = json.data;
    state.session = session;
    if (admin_info) {
      if (admin_info.max_bets) state.maxBets = admin_info.max_bets;
      updateMaxBetBadges();
    }

    // Previous 3 rows grid
    const prevGrid = state.currentGrid || [
      [3, 8, 1, 6, 2],
      [7, 7, 7, 8, 9],
      [4, 5, 2, 9, 3]
    ];

    // Build independent cascading roll for all 5 reels with strict 1-9 sequential rotations
    const reelPromises = [];

    for (let c = 0; c < 5; c++) {
      const p = new Promise(resolve => {
        const strip = document.getElementById(`reel-${c}`);
        if (!strip) return resolve();

        const targetNums = [grid[0][c], grid[1][c], grid[2][c]];
        const prevNums = [prevGrid[0][c], prevGrid[1][c], prevGrid[2][c]];

        const targetTop = targetNums[0];
        const prevTop = prevNums[0];

        // Delta to reach prevTop from targetTop along the 1-9 cyclic sequence
        let delta = (prevTop - targetTop) % 9;
        if (delta < 0) delta += 9;

        // Number of full 9-number revolutions (staggered for reels 0..4)
        const fullLoops = state.isTurbo ? (2 + c) : (3 + c * 2);
        const kMinus2 = delta + fullLoops * 9;
        const totalItems = kMinus2 + 3;

        // Generate strip: every single number is strictly ((targetTop - 1 + i) % 9) + 1
        const stripNums = [];
        for (let i = 0; i < totalItems; i++) {
          stripNums.push(((targetTop - 1 + i) % 9) + 1);
        }

        // Render nodes
        strip.innerHTML = "";
        strip.style.transition = "none";

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

        // Dynamically measure actual cell height rendered by CSS for pixel-perfect offset on all screens
        const cellH = strip.firstElementChild ? strip.firstElementChild.offsetHeight : 110;
        const initialOffset = -((totalItems - 3) * cellH);
        strip.style.transform = `translateY(${initialOffset}px)`;

        // Compute duration with staggered interval
        const duration = state.isTurbo ? (0.35 + c * 0.12) : (0.80 + c * 0.25);

        // Force browser layout repaint
        void strip.offsetHeight;

        strip.classList.add("strip-rolling");
        strip.style.transition = `transform ${duration}s cubic-bezier(0.12, 0.95, 0.25, 1.08)`;
        strip.style.transform = "translateY(0px)";

        setTimeout(() => {
          strip.classList.remove("strip-rolling");
          soundEngine.playReelStop();
          telegramEngine.haptic("rigid");
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
    telegramEngine.haptic("error");
    showToast(`⚠️ ${err.message || "Lỗi khi quay thưởng!"}`, true);
    state.isAutoSpin = false;
    if (dom.btnAuto) {
      dom.btnAuto.classList.remove("active");
      dom.btnAuto.textContent = "🔄 AUTO (OFF)";
    }
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

  if (totalWon > 0) {
    state.lastShareSlip = {
      round_id: "Solo #" + (state.session ? state.session.total_spins : state.historyData.length),
      amount: totalWon,
      hand: analysis.hand_title_vi
    };
    if (dom.shareWinContainer) {
      dom.shareWinContainer.style.display = "block";
      if (dom.quickShareWinText) {
        dom.quickShareWinText.textContent = `KHOE CHIẾN TÍCH (+${totalWon.toLocaleString()} Xu) LÊN PHÒNG CHAT`;
      }
    }
  } else {
    if (dom.shareWinContainer) {
      dom.shareWinContainer.style.display = "none";
    }
  }

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

    const totalBet = payout.total_bet || 10;
    if (totalWon >= totalBet * 5 && totalWon > 0 && dom.winBanner) {
      telegramEngine.haptic("warning");
      dom.winBannerTitle.textContent = totalWon >= totalBet * 20 ? "JACKPOT / EPIC WIN!" : "BIG WIN!";
      dom.winBannerAmount.textContent = `+${totalWon.toFixed(2)}`;
      dom.winBannerDesc.textContent = `${analysis.hand_title_vi} • Lãi ròng: +${payout.net_profit.toFixed(2)}`;
      dom.winBanner.style.display = "block";
      dom.winBanner.classList.add("show");
      soundEngine.playBigWin();

      if (state.winBannerTimer) clearTimeout(state.winBannerTimer);
      state.winBannerTimer = setTimeout(() => {
        if (dom.winBanner) {
          dom.winBanner.classList.remove("show");
          dom.winBanner.style.display = "none";
        }
      }, 3000);
    } else if (totalWon > 0) {
      telegramEngine.haptic("success");
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

  // Trigger blinking glow highlight for winning center payline numbers
  highlightWinningCenterNumbers(center_row, analysis, payout);
}

function clearWinningHighlights() {
  document.querySelectorAll(".cell-win-highlight").forEach(el => {
    el.classList.remove("cell-win-highlight");
    el.querySelector(".cell-win-badge")?.remove();
  });
}

function highlightWinningCenterNumbers(center_row, analysis, payout) {
  clearWinningHighlights();
  if (!payout || payout.total_won <= 0) return;

  const winningCols = new Set();
  const placedBets = state.placedBets || {};

  // 1. Single Number Bets: SO_1 .. SO_9
  for (let d = 1; d <= 9; d++) {
    const betKey = `SO_${d}`;
    if (placedBets[betKey] && placedBets[betKey] > 0) {
      center_row.forEach((num, colIdx) => {
        if (num === d) winningCols.add(colIdx);
      });
    }
  }

  // 2. Poker Hands / Repeating Numbers (Pair, Two Pair, Three of a Kind, Quads, Quints, Full House)
  if (analysis && analysis.counts) {
    const isPokerWin = payout.winning_items && payout.winning_items.some(w =>
      w.key === "BASE_SPIN" || (w.key && w.key.startsWith("POKER_"))
    );
    if (isPokerWin) {
      center_row.forEach((num, colIdx) => {
        if (analysis.counts[num] >= 2) winningCols.add(colIdx);
      });
    }
  }

  // 3. Straight (Sảnh) or Flush (Thùng)
  const isSanhWin = payout.winning_items && payout.winning_items.some(w => w.key && w.key.startsWith("SANH"));
  const isThungWin = payout.winning_items && payout.winning_items.some(w => w.key && w.key.startsWith("THUNG"));
  if ((analysis.is_sanh && isSanhWin) || (analysis.is_thung && isThungWin)) {
    for (let c = 0; c < 5; c++) winningCols.add(c);
  }

  // 4. If won on other bets (e.g. Tai/Xiu, Chan/Le, etc.) and no individual numbers isolated yet:
  if (winningCols.size === 0) {
    for (let c = 0; c < 5; c++) winningCols.add(c);
  }

  // Apply blinking glow effect and TRÚNG badge to winning center cells
  winningCols.forEach(colIdx => {
    const strip = document.getElementById(`reel-${colIdx}`);
    if (strip) {
      const centerCell = strip.querySelector(".row-center");
      if (centerCell) {
        centerCell.classList.add("cell-win-highlight");
        if (!centerCell.querySelector(".cell-win-badge")) {
          const badge = document.createElement("span");
          badge.className = "cell-win-badge";
          badge.textContent = "✨ TRÚNG";
          centerCell.appendChild(badge);
        }
      }
    }
  });
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
  const totalItems = chrono.length;
  const mode = state.soikeoMode;

  containers.forEach(container => {
    chrono.forEach((item, idx) => {
      const isLatest = (idx === totalItems - 1);
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

      cell.className = `bead-cell ${cls} ${isLatest ? "is-latest-bead" : ""}`;
      cell.innerHTML = `
        <span class="bead-char">${char}</span>
        <span class="bead-num">${item.sum}</span>
        ${isLatest ? '<span class="bead-latest-tag">MỚI</span>' : ''}
      `;
      cell.title = `${isLatest ? "⚡ [VÁN MỚI NHẤT]\n" : ""}Phiên #${item.spin}\nDãy: [ ${item.center_row.join(" - ")} ]\nTổng: ${item.sum} (${item.is_tai ? "Tài" : (item.is_xiu ? "Xỉu" : "Hòa 25")})\n${item.best_hand}`;
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

  const lastColIndex = columns.length - 1;
  const lastDotIndex = columns.length > 0 ? columns[lastColIndex].length - 1 : -1;

  containers.forEach(container => {
    columns.forEach((col, cIdx) => {
      const isLastCol = (cIdx === lastColIndex);
      const colDiv = document.createElement("div");
      colDiv.className = `big-road-col ${isLastCol ? "is-latest-col" : ""}`;

      // If streak >= 3, add streak indicator badge at the top
      if (col.length >= 3) {
        const streakTag = document.createElement("span");
        streakTag.className = "big-road-streak-tag";
        streakTag.textContent = `${col.length}x`;
        streakTag.title = `Chuỗi bệt ${col.length} phiên liên tiếp`;
        colDiv.appendChild(streakTag);
      }

      col.forEach((dot, dIdx) => {
        const isLatest = isLastCol && (dIdx === lastDotIndex);
        const dotDiv = document.createElement("div");
        dotDiv.className = `big-road-dot ${dot.outcome} ${dot.hasTie ? "tie-mark" : ""} ${isLatest ? "is-latest-dot" : ""}`;
        dotDiv.innerHTML = `
          <span>${dot.char}</span>
          ${isLatest ? '<span class="big-road-latest-tag">⚡ MỚI</span>' : ''}
        `;
        dotDiv.title = `${isLatest ? "⚡ [VÁN MỚI NHẤT] " : ""}Phiên #${dot.spin}: Tổng ${dot.sum} (${dot.outcome.toUpperCase()})${dot.hasTie ? " • Kèm Hòa 25" : ""}`;
        colDiv.appendChild(dotDiv);
      });

      // Standard 6-slot Baccarat matrix alignment: append empty slot circles
      for (let s = col.length; s < 6; s++) {
        const slotDiv = document.createElement("div");
        slotDiv.className = "big-road-slot";
        colDiv.appendChild(slotDiv);
      }

      container.appendChild(colDiv);
    });
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
      ctx.font = "bold 10px 'Orbitron', 'Be Vietnam Pro', sans-serif";
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
      pushBetHistory();
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

function showToast(message, type = "info") {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "app-floating-toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = message;

  const isErr = (type === true || type === "error" || type === "danger");
  const isGold = (type === "gold" || type === "fortune");
  const isCyan = (type === "cyan" || type === "info" || type === "free");
  const isWarn = (type === "warning" || type === "warn");

  if (isErr) {
    toast.style.background = "linear-gradient(135deg, rgba(160, 0, 25, 0.96) 0%, rgba(90, 0, 15, 0.98) 100%)";
    toast.style.borderColor = "#ff1744";
    toast.style.color = "#ffffff";
    toast.style.boxShadow = "0 6px 25px rgba(255, 23, 68, 0.75)";
  } else if (isGold) {
    toast.style.background = "linear-gradient(135deg, rgba(32, 22, 2, 0.96) 0%, rgba(15, 10, 0, 0.98) 100%)";
    toast.style.borderColor = "#ffd700";
    toast.style.color = "#ffd700";
    toast.style.boxShadow = "0 6px 30px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 215, 0, 0.3)";
  } else if (isCyan) {
    toast.style.background = "linear-gradient(135deg, rgba(0, 32, 50, 0.96) 0%, rgba(2, 16, 26, 0.98) 100%)";
    toast.style.borderColor = "#00e5ff";
    toast.style.color = "#00e5ff";
    toast.style.boxShadow = "0 6px 28px rgba(0, 229, 255, 0.75), inset 0 0 10px rgba(0, 229, 255, 0.3)";
  } else if (isWarn) {
    toast.style.background = "linear-gradient(135deg, rgba(45, 30, 0, 0.96) 0%, rgba(20, 12, 0, 0.98) 100%)";
    toast.style.borderColor = "#ff9100";
    toast.style.color = "#ffb74d";
    toast.style.boxShadow = "0 6px 25px rgba(255, 145, 0, 0.7)";
  } else {
    toast.style.background = "rgba(19, 23, 38, 0.95)";
    toast.style.borderColor = "#00e5ff";
    toast.style.color = "#ffffff";
    toast.style.boxShadow = "0 4px 20px rgba(0, 229, 255, 0.5)";
  }

  toast.classList.add("show");
  if (state.toastTimer) clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function setupAdminControls() {
  const btnRefresh = document.getElementById("btnRefreshAdmin");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      soundEngine.playChip();
      telegramEngine.haptic("medium");
      loadAdminStatus();
    });
  }

  // Toggle Sảnh Chuẩn
  const toggleSanhChuan = document.getElementById("toggleSanhChuan");
  if (toggleSanhChuan) {
    toggleSanhChuan.addEventListener("change", async () => {
      soundEngine.playChip();
      telegramEngine.haptic("medium");
      const isAllowed = toggleSanhChuan.checked;
      try {
        const res = await fetch("/api/admin/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allow_sanh_chuan: isAllowed })
        });
        const json = await res.json();
        if (json.status === "success") {
          showToast(isAllowed ? "🟢 ĐÃ MỞ: Sảnh Chuẩn sẽ nổ theo RNG tự nhiên!" : "🔒 ĐÃ KHÓA: Sảnh Chuẩn đã bị triệt tiêu 100%!");
          loadAdminStatus();
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  // Toggle Ngũ Quý
  const toggleNguQuy = document.getElementById("toggleNguQuy");
  if (toggleNguQuy) {
    toggleNguQuy.addEventListener("change", async () => {
      soundEngine.playChip();
      telegramEngine.haptic("medium");
      const isAllowed = toggleNguQuy.checked;
      try {
        const res = await fetch("/api/admin/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allow_ngu_quy: isAllowed })
        });
        const json = await res.json();
        if (json.status === "success") {
          showToast(isAllowed ? "🟢 ĐÃ MỞ: Ngũ Quý sẽ nổ theo RNG tự nhiên!" : "🔒 ĐÃ KHÓA: Ngũ Quý đã bị triệt tiêu 100%!");
          loadAdminStatus();
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  // Quick Pool Buttons
  const btnAdd10k = document.getElementById("btnAdminAdd10k");
  if (btnAdd10k) {
    btnAdd10k.addEventListener("click", () => updateJackpotPool({ add_jackpot_amount: 10000 }));
  }

  const btnAdd50k = document.getElementById("btnAdminAdd50k");
  if (btnAdd50k) {
    btnAdd50k.addEventListener("click", () => updateJackpotPool({ add_jackpot_amount: 50000 }));
  }

  const btnSetTarget = document.getElementById("btnAdminSetTarget");
  if (btnSetTarget) {
    btnSetTarget.addEventListener("click", () => updateJackpotPool({ set_jackpot_amount: 100000 }));
  }

  const btnResetPool = document.getElementById("btnAdminResetPool");
  if (btnResetPool) {
    btnResetPool.addEventListener("click", () => updateJackpotPool({ set_jackpot_amount: 20000 }));
  }

  // Save Max Bets
  const btnSaveMaxBets = document.getElementById("btnSaveMaxBets");
  if (btnSaveMaxBets) {
    btnSaveMaxBets.addEventListener("click", async () => {
      soundEngine.playChip();
      telegramEngine.haptic("success");

      const sanhChuan = parseInt(document.getElementById("inputMaxSanhChuan")?.value) || 20;
      const nguQuy = parseInt(document.getElementById("inputMaxNguQuy")?.value) || 20;
      const tuQuy = parseInt(document.getElementById("inputMaxTuQuy")?.value) || 100;
      const cuLu = parseInt(document.getElementById("inputMaxCuLu")?.value) || 200;
      const def = parseInt(document.getElementById("inputMaxDefault")?.value) || 5000;

      try {
        const res = await fetch("/api/admin/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            max_bets: {
              SANH_CHUAN: sanhChuan,
              NGU_QUY: nguQuy,
              TU_QUY: tuQuy,
              CU_LU: cuLu,
              DEFAULT: def
            }
          })
        });
        const json = await res.json();
        if (json.status === "success") {
          state.maxBets = json.data.max_bets;
          updateMaxBetBadges();
          const msgEl = document.getElementById("saveMaxBetMsg");
          if (msgEl) {
            msgEl.textContent = "✅ Đã lưu cấu hình hạn mức thành công!";
            setTimeout(() => { msgEl.textContent = ""; }, 3000);
          }
          showToast("✅ Đã cập nhật hạn mức cược tối đa!");
        }
      } catch (e) {
        console.error(e);
      }
    });
  }
}

async function updateJackpotPool(payload) {
  soundEngine.playChip();
  telegramEngine.haptic("medium");
  try {
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.status === "success") {
      showToast("💰 Đã cập nhật số dư Quỹ Hũ thành công!");
      loadAdminStatus();
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadAdminStatus(silent = false) {
  try {
    const res = await fetch("/api/admin/status");
    const json = await res.json();
    if (json.status === "success") {
      state.adminData = json.data;
      if (json.data.config?.max_bets) {
        state.maxBets = json.data.config.max_bets;
        updateMaxBetBadges();
      }
      if (!silent) {
        renderAdminStatus(json.data);
      }
    }
  } catch (err) {
    console.error("Failed to load admin status:", err);
  }
}

function updateMaxBetBadges() {
  if (!state.maxBets) return;
  const badgeSanh = document.getElementById("badge-max-SANH_CHUAN");
  if (badgeSanh) badgeSanh.textContent = `MAX: ${state.maxBets.SANH_CHUAN || 20}`;

  const badgeNgu = document.getElementById("badge-max-NGU_QUY");
  if (badgeNgu) badgeNgu.textContent = `MAX: ${state.maxBets.NGU_QUY || 20}`;

  const badgeTu = document.getElementById("badge-max-TU_QUY");
  if (badgeTu) badgeTu.textContent = `MAX: ${state.maxBets.TU_QUY || 100}`;

  const badgeCu = document.getElementById("badge-max-CU_LU");
  if (badgeCu) badgeCu.textContent = `MAX: ${state.maxBets.CU_LU || 200}`;
}

function renderAdminStatus(data) {
  if (!data) return;

  const { finance, jackpot, config } = data;

  // 1. Finance KPIs
  const elTurnover = document.getElementById("admTurnover");
  if (elTurnover) elTurnover.textContent = finance.total_turnover.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const elPayout = document.getElementById("admPayout");
  if (elPayout) elPayout.textContent = finance.total_payout.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const elProfit = document.getElementById("admProfit");
  if (elProfit) {
    elProfit.textContent = `${finance.net_profit >= 0 ? "+" : ""}${finance.net_profit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    elProfit.style.color = finance.net_profit >= 0 ? "#00e676" : "#ff5252";
  }

  const elMargin = document.getElementById("admProfitMargin");
  if (elMargin) elMargin.textContent = `Margin: ${finance.profit_margin_pct.toFixed(2)}%`;

  const elSpins = document.getElementById("admSpins");
  if (elSpins) elSpins.textContent = finance.total_spins.toLocaleString("en-US");

  // 2. Jackpot Pool
  const elPoolCurrent = document.getElementById("admPoolCurrent");
  if (elPoolCurrent) elPoolCurrent.textContent = `${jackpot.current_pool.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Xu`;

  const elPoolTarget = document.getElementById("admPoolTarget");
  if (elPoolTarget) elPoolTarget.textContent = `${jackpot.target_pool.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const elPoolBar = document.getElementById("admPoolBar");
  if (elPoolBar) elPoolBar.style.width = `${Math.min(100, Math.max(2, jackpot.pool_ratio_pct))}%`;

  const elPoolPct = document.getElementById("admPoolPct");
  if (elPoolPct) elPoolPct.textContent = `${jackpot.pool_ratio_pct.toFixed(1)}%`;

  const elPoolBadge = document.getElementById("admPoolSafetyBadge");
  const elPoolSafetyText = document.getElementById("admPoolSafetyText");
  const elPoolAdvise = document.getElementById("admPoolAdvise");

  if (jackpot.is_ready) {
    if (elPoolBadge) elPoolBadge.className = "adm-status-pill ready";
    if (elPoolSafetyText) elPoolSafetyText.textContent = "🟢 ĐÃ ĐỦ QUỸ AN TOÀN (CÓ THỂ BẬT NỔ)";
    if (elPoolAdvise) elPoolAdvise.innerHTML = "✨ Quỹ đã đạt mức bảo chứng an toàn. Nhà cái có thể chủ động bật mở công tắc nổ hũ tự nhiên!";
  } else {
    if (elPoolBadge) elPoolBadge.className = "adm-status-pill";
    const diff = Math.max(0, jackpot.target_pool - jackpot.current_pool);
    if (elPoolSafetyText) elPoolSafetyText.textContent = "🔒 CHƯA ĐỦ QUỸ AN TOÀN (KHUYẾN NGHỊ KHÓA)";
    if (elPoolAdvise) elPoolAdvise.innerHTML = `💡 Cần tích lũy thêm <strong>${diff.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Xu</strong> để đạt ngưỡng an toàn 100K.`;
  }

  const elBlockedSanh = document.getElementById("admBlockedSanhChuan");
  if (elBlockedSanh) elBlockedSanh.textContent = jackpot.blocked_sanh_chuan || 0;

  const elBlockedNgu = document.getElementById("admBlockedNguQuy");
  if (elBlockedNgu) elBlockedNgu.textContent = jackpot.blocked_ngu_quy || 0;

  const elPaidJackpot = document.getElementById("admTotalJackpotPaid");
  if (elPaidJackpot) elPaidJackpot.textContent = (jackpot.total_paid || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 3. Switches
  const cardSanh = document.getElementById("cardSanhChuan");
  const toggleSanh = document.getElementById("toggleSanhChuan");
  const badgeSanh = document.getElementById("badgeSanhChuan");
  const descSanh = document.getElementById("descSanhChuan");

  if (toggleSanh) toggleSanh.checked = !!config.allow_sanh_chuan;
  if (config.allow_sanh_chuan) {
    if (cardSanh) cardSanh.classList.add("unlocked");
    if (badgeSanh) {
      badgeSanh.className = "sw-current-badge unlocked";
      badgeSanh.innerHTML = `<span class="sw-badge-icon">🟢</span><span class="sw-badge-txt">ĐANG MỞ (RNG TỰ NHIÊN)</span>`;
    }
    if (descSanh) descSanh.textContent = "Hệ thống đang mở. Cho phép trúng tự nhiên theo RNG GLI-19.";
  } else {
    if (cardSanh) cardSanh.classList.remove("unlocked");
    if (badgeSanh) {
      badgeSanh.className = "sw-current-badge locked";
      badgeSanh.innerHTML = `<span class="sw-badge-icon">🔒</span><span class="sw-badge-txt">ĐANG KHÓA (0% NỔ)</span>`;
    }
    if (descSanh) descSanh.textContent = "Hệ thống đang khóa. Tuyệt đối 0% ra kết quả này.";
  }

  const cardNgu = document.getElementById("cardNguQuy");
  const toggleNgu = document.getElementById("toggleNguQuy");
  const badgeNgu = document.getElementById("badgeNguQuy");
  const descNgu = document.getElementById("descNguQuy");

  if (toggleNgu) toggleNgu.checked = !!config.allow_ngu_quy;
  if (config.allow_ngu_quy) {
    if (cardNgu) cardNgu.classList.add("unlocked");
    if (badgeNgu) {
      badgeNgu.className = "sw-current-badge unlocked";
      badgeNgu.innerHTML = `<span class="sw-badge-icon">🟢</span><span class="sw-badge-txt">ĐANG MỞ (RNG TỰ NHIÊN)</span>`;
    }
    if (descNgu) descNgu.textContent = "Hệ thống đang mở. Cho phép trúng tự nhiên theo RNG GLI-19.";
  } else {
    if (cardNgu) cardNgu.classList.remove("unlocked");
    if (badgeNgu) {
      badgeNgu.className = "sw-current-badge locked";
      badgeNgu.innerHTML = `<span class="sw-badge-icon">🔒</span><span class="sw-badge-txt">ĐANG KHÓA (0% NỔ)</span>`;
    }
    if (descNgu) descNgu.textContent = "Hệ thống đang khóa. Tuyệt đối 0% ra kết quả này.";
  }

  // 4. Max bet inputs (populate if user is not actively editing)
  if (config.max_bets) {
    const inputSanh = document.getElementById("inputMaxSanhChuan");
    if (inputSanh && document.activeElement !== inputSanh) inputSanh.value = config.max_bets.SANH_CHUAN || 20;

    const inputNgu = document.getElementById("inputMaxNguQuy");
    if (inputNgu && document.activeElement !== inputNgu) inputNgu.value = config.max_bets.NGU_QUY || 20;

    const inputTu = document.getElementById("inputMaxTuQuy");
    if (inputTu && document.activeElement !== inputTu) inputTu.value = config.max_bets.TU_QUY || 100;

    const inputCu = document.getElementById("inputMaxCuLu");
    if (inputCu && document.activeElement !== inputCu) inputCu.value = config.max_bets.CU_LU || 200;

    const inputDef = document.getElementById("inputMaxDefault");
    if (inputDef && document.activeElement !== inputDef) inputDef.value = config.max_bets.DEFAULT || 5000;
  }
}

/**
 * ----------------------------------------------------
 * CHẾ ĐỘ CƯỢC: KHÓA SỐ THẦN TÀI (FORTUNE LOCK MODE)
 * ----------------------------------------------------
 */

function setupFortuneModeControls() {
  const btnFree = document.getElementById("btnFModeFree");
  const btnFortune = document.getElementById("btnFModeFortune");
  const btnExit = document.getElementById("btnExitFortuneMode");

  if (btnFree) {
    btnFree.addEventListener("click", (e) => {
      if (e) e.preventDefault();
      try {
        soundEngine.init();
        soundEngine.playChip();
        telegramEngine.haptic("light");
      } catch (err) {}
      state.fortuneBetMode = "free";
      renderFortuneLockState();
      showToast("🌐 <strong>CHẾ ĐỘ TỰ DO</strong>: Đang kích hoạt (Dải số 1 - 9 tự nhiên)", "cyan");
    });
  }

  if (btnFortune) {
    btnFortune.addEventListener("click", (e) => {
      if (e) e.preventDefault();
      try {
        soundEngine.init();
        soundEngine.playWinTone();
        telegramEngine.haptic("medium");
      } catch (err) {}
      state.fortuneBetMode = "fortune";
      renderFortuneLockState();
      showToast("⚡ <strong>KHÓA SỐ THẦN TÀI</strong>: Đang kích hoạt (Hãy chọn số mục tiêu)", "gold");
    });
  }

  if (btnExit) {
    btnExit.addEventListener("click", (e) => {
      if (e) e.preventDefault();
      try {
        soundEngine.init();
        soundEngine.playChip();
        telegramEngine.haptic("light");
      } catch (err) {}
      state.fortuneBetMode = "free";
      renderFortuneLockState();
      showToast("🌐 Đã chuyển về <strong>CHẾ ĐỘ TỰ DO</strong>", "cyan");
    });
  }

  // Quick Lock Presets
  const btn123 = document.getElementById("btnQuickLock123");
  if (btn123) {
    btn123.addEventListener("click", (e) => {
      if (e) e.preventDefault();
      try {
        soundEngine.init();
        soundEngine.playWinTone();
        telegramEngine.haptic("selection");
      } catch (err) {}
      state.fortuneBetMode = "fortune";
      state.fortuneLockedNumbers = [1, 2, 3];
      renderFortuneLockState();
      showToast("⚡ Đã khóa bộ số Thần Tài: <strong>1 - 2 - 3</strong> (Mục tiêu Sảnh Chuẩn)", "gold");
    });
  }

  const btn7 = document.getElementById("btnQuickLock7");
  if (btn7) {
    btn7.addEventListener("click", (e) => {
      if (e) e.preventDefault();
      try {
        soundEngine.init();
        soundEngine.playWinTone();
        telegramEngine.haptic("selection");
      } catch (err) {}
      state.fortuneBetMode = "fortune";
      state.fortuneLockedNumbers = [7];
      renderFortuneLockState();
      showToast("👑 Đã khóa Con Số May Mắn: <strong>Số 7</strong> (Mục tiêu Ngũ Quý 77777)", "gold");
    });
  }

  const btn689 = document.getElementById("btnQuickLock689");
  if (btn689) {
    btn689.addEventListener("click", (e) => {
      if (e) e.preventDefault();
      try {
        soundEngine.init();
        soundEngine.playWinTone();
        telegramEngine.haptic("selection");
      } catch (err) {}
      state.fortuneBetMode = "fortune";
      state.fortuneLockedNumbers = [6, 8, 9];
      renderFortuneLockState();
      showToast("💰 Đã khóa bộ số Thần Tài: <strong>6 - 8 - 9</strong> (Phát Lộc)", "gold");
    });
  }

  const btnClear = document.getElementById("btnQuickLockClear");
  if (btnClear) {
    btnClear.addEventListener("click", (e) => {
      if (e) e.preventDefault();
      try {
        soundEngine.init();
        soundEngine.playChip();
        telegramEngine.haptic("warning");
      } catch (err) {}
      state.fortuneLockedNumbers = [];
      renderFortuneLockState();
      showToast("Đã xóa toàn bộ số khóa. Bấm vào ô số 1-9 để khóa số mới!", "warn");
    });
  }

  // Initial render
  renderFortuneLockState();
}

function toggleFortuneLockNumber(num) {
  try {
    soundEngine.init();
    telegramEngine.haptic("selection");
  } catch (err) {}

  if (state.fortuneBetMode !== "fortune") {
    state.fortuneBetMode = "fortune";
    state.fortuneLockedNumbers = [num];
    try { soundEngine.playWinTone(); } catch (e) {}
    showToast(`⚡ Đã kích hoạt <strong>KHÓA SỐ THẦN TÀI</strong> và khóa <strong>Số ${num}</strong>!`, "gold");
    renderFortuneLockState();
    return;
  }

  if (state.fortuneLockedNumbers.includes(num)) {
    state.fortuneLockedNumbers = state.fortuneLockedNumbers.filter(n => n !== num);
    try { soundEngine.playChip(); } catch (e) {}
    showToast(`Đã bỏ khóa Số ${num}`, "cyan");
  } else {
    if (state.fortuneLockedNumbers.length >= 5) {
      try { telegramEngine.haptic("error"); } catch (e) {}
      showToast("Chỉ được chọn tối đa 5 con số Thần Tài cùng lúc!", "warn");
      return;
    }
    state.fortuneLockedNumbers.push(num);
    state.fortuneLockedNumbers.sort((a, b) => a - b);
    try { soundEngine.playWinTone(); } catch (e) {}
    showToast(`⚡ Đã thêm <strong>Số ${num}</strong> vào danh sách Khóa Thần Tài!`, "gold");
  }

  renderFortuneLockState();
}

function renderFortuneLockState() {
  const isFortune = state.fortuneBetMode === "fortune";
  const locked = state.fortuneLockedNumbers || [];

  // 1. Mode switcher tabs
  const btnFree = document.getElementById("btnFModeFree");
  const btnFortune = document.getElementById("btnFModeFortune");
  if (btnFree) {
    btnFree.classList.toggle("active", !isFortune);
    const badgeFree = btnFree.querySelector(".fmode-status-badge");
    if (badgeFree) badgeFree.style.display = !isFortune ? "inline-block" : "none";
  }
  if (btnFortune) {
    btnFortune.classList.toggle("active", isFortune);
    const badgeFortune = btnFortune.querySelector(".fmode-status-badge");
    if (badgeFortune) badgeFortune.style.display = isFortune ? "inline-block" : "none";
  }

  // 2. Section Header Highlight
  const headerF = document.getElementById("betSectionHeaderF");
  if (headerF) {
    headerF.classList.toggle("mode-fortune-active", isFortune);
  }

  // 3. Global banner on top of betting board
  const banner = document.getElementById("fortuneLockGlobalBanner");
  const bannerNums = document.getElementById("flgbNumsBadge");
  if (banner) {
    banner.style.display = isFortune ? "flex" : "none";
  }
  if (bannerNums) {
    bannerNums.textContent = locked.length > 0 ? locked.join(", ") : "(Chưa chọn số nào)";
  }

  // 4. Fortune helper card
  const card = document.getElementById("fortuneLockControlCard");
  const tagsContainer = document.getElementById("flcSelectedTags");
  if (card) {
    card.style.display = isFortune ? "block" : "none";
  }

  if (tagsContainer) {
    if (locked.length === 0) {
      tagsContainer.innerHTML = '<span class="flc-empty-hint">Chưa chọn số nào (Bấm các số 1-9 bên dưới hoặc chọn nhanh)</span>';
    } else {
      tagsContainer.innerHTML = locked.map(num => `
        <span class="flc-num-tag">
          ⚡ Số ${num}
          <span class="flc-num-tag-del" data-del-num="${num}" title="Bỏ chọn số này">✕</span>
        </span>
      `).join("");

      tagsContainer.querySelectorAll(".flc-num-tag-del").forEach(delBtn => {
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const n = parseInt(delBtn.dataset.delNum);
          if (n) toggleFortuneLockNumber(n);
        });
      });
    }
  }

  // 5. Toggle class on betting board / row F
  const rowSingle = document.getElementById("rowSingleNumbers");
  if (rowSingle) {
    rowSingle.classList.toggle("fortune-mode-active", isFortune);
  }
  const betGrid = document.querySelector(".bet-grid");
  if (betGrid) {
    betGrid.classList.toggle("fortune-mode-active", isFortune);
  }

  // 6. Update each number cell (1 to 9)
  for (let num = 1; num <= 9; num++) {
    const cell = document.querySelector(`.bet-cell.num-cell[data-num="${num}"]`);
    const pill = document.getElementById(`lock-pill-${num}`);
    const isLocked = isFortune && locked.includes(num);

    if (cell) {
      cell.classList.toggle("is-locked-fortune", isLocked);
    }
    if (pill) {
      if (isFortune && isLocked) {
        pill.style.display = "inline-flex";
        pill.textContent = "⚡ ĐÃ CHỌN";
        pill.title = `Bấm để hủy chọn Số ${num}`;
      } else {
        pill.style.display = "none";
        pill.textContent = "";
      }
    }
  }
}

/**
 * ============================================================
 * LIVE MULTIPLAYER ROOM & SOCIAL SUITE CONTROLLER
 * ============================================================
 */

function getLiveUserId() {
  const tgUser = telegramEngine.tg?.initDataUnsafe?.user;
  if (tgUser && tgUser.id) return `tg_${tgUser.id}`;
  let localId = localStorage.getItem("lucky_live_uid");
  if (!localId) {
    localId = "guest_" + Math.random().toString(36).substring(2, 8);
    localStorage.setItem("lucky_live_uid", localId);
  }
  return localId;
}

function getLiveUserName() {
  const tgUser = telegramEngine.tg?.initDataUnsafe?.user;
  if (tgUser) {
    if (tgUser.username) return `@${tgUser.username}`;
    return tgUser.first_name || "Thành viên";
  }
  let localName = localStorage.getItem("lucky_live_uname");
  if (!localName) {
    localName = "Người Chơi " + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem("lucky_live_uname", localName);
  }
  return localName;
}

function setupLiveRoomControls() {
  // Mode switcher: Solo vs Live
  if (dom.btnModeSolo) {
    dom.btnModeSolo.addEventListener("click", () => switchGameplayMode("solo"));
  }
  if (dom.btnModeLive) {
    dom.btnModeLive.addEventListener("click", () => switchGameplayMode("live"));
  }

  // Open Chat Drawer from Cabinet Dock Button & Floating FAB
  if (dom.btnOpenChatDock) {
    dom.btnOpenChatDock.addEventListener("click", openChatDrawer);
  }
  if (dom.btnFixedChatFab) {
    dom.btnFixedChatFab.addEventListener("click", openChatDrawer);
  }

  // Close Chat Drawer
  if (dom.btnCloseChatDrawer) {
    dom.btnCloseChatDrawer.addEventListener("click", closeChatDrawer);
  }
  if (dom.chatDrawerBackdrop) {
    dom.chatDrawerBackdrop.addEventListener("click", (e) => {
      if (e.target === dom.chatDrawerBackdrop || (dom.chatDrawerPanel && !dom.chatDrawerPanel.contains(e.target))) {
        closeChatDrawer();
      }
    });
    dom.chatDrawerBackdrop.addEventListener("touchend", (e) => {
      if (e.target === dom.chatDrawerBackdrop) {
        e.preventDefault();
        closeChatDrawer();
      }
    });
  }

  if (dom.chatDrawerPanel) {
    dom.chatDrawerPanel.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  // Keyboard Escape to close chat drawer on desktop
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dom.chatDrawerBackdrop && dom.chatDrawerBackdrop.classList.contains("open")) {
      closeChatDrawer();
    }
  });

  // Chat toggle legacy fallback
  if (dom.chatHeaderToggle) {
    dom.chatHeaderToggle.addEventListener("click", toggleLiveChat);
  }

  // Chat form submit
  if (dom.chatForm) {
    dom.chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = dom.chatInput ? dom.chatInput.value.trim() : "";
      if (val) {
        sendChatMessage(val);
        dom.chatInput.value = "";
      }
    });
  }

  // Quick canned messages
  if (dom.cannedBtns) {
    dom.cannedBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const msg = btn.dataset.msg;
        if (msg) {
          soundEngine.init();
          soundEngine.playChip();
          telegramEngine.haptic("light");
          sendChatMessage(msg);
        }
      });
    });
  }

  // Quick reactions strip on cabinet
  if (dom.rxPillBtns) {
    dom.rxPillBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const emoji = btn.dataset.emoji;
        if (emoji) {
          sendReaction(emoji, e.clientX);
        }
      });
    });
  }

  // Reaction buttons inside chat drawer
  if (dom.rxBtns) {
    dom.rxBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const emoji = btn.dataset.emoji;
        if (emoji) {
          sendReaction(emoji, e.clientX);
        }
      });
    });
  }

  // Quick share win button on cabinet
  if (dom.btnQuickShareWin) {
    dom.btnQuickShareWin.addEventListener("click", () => {
      shareWinSlipAction();
    });
  }

  // Legacy share win slip button
  if (dom.btnShareWinSlip) {
    dom.btnShareWinSlip.addEventListener("click", () => {
      shareWinSlipAction();
    });
  }

  // Invite friends buttons
  if (dom.btnInviteLiveRoom) {
    dom.btnInviteLiveRoom.addEventListener("click", handleInviteFriends);
  }
  if (dom.btnDrawerInvite) {
    dom.btnDrawerInvite.addEventListener("click", handleInviteFriends);
  }

  // Telegram share win buttons
  if (dom.btnShareWinTelegram) {
    dom.btnShareWinTelegram.addEventListener("click", handleShareWinToTelegram);
  }
  if (dom.btnQuickShareTelegram) {
    dom.btnQuickShareTelegram.addEventListener("click", handleShareWinToTelegram);
  }

  // Modal Phát Lộc Toàn Phòng
  if (dom.btnSendRedPacket) {
    dom.btnSendRedPacket.addEventListener("click", openSendRedPacketModal);
  }
  if (dom.btnCloseRedPacketModal) {
    dom.btnCloseRedPacketModal.addEventListener("click", closeSendRedPacketModal);
  }
  if (dom.btnCancelSendRedPacket) {
    dom.btnCancelSendRedPacket.addEventListener("click", closeSendRedPacketModal);
  }
  if (dom.modalSendRedPacket) {
    dom.modalSendRedPacket.addEventListener("click", (e) => {
      if (e.target === dom.modalSendRedPacket) closeSendRedPacketModal();
    });
  }
  if (dom.rpPresetChips) {
    dom.rpPresetChips.forEach(chip => {
      chip.addEventListener("click", () => {
        dom.rpPresetChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        if (dom.inputCustomRedPacket) {
          dom.inputCustomRedPacket.value = chip.dataset.amount;
        }
      });
    });
  }
  if (dom.inputCustomRedPacket) {
    dom.inputCustomRedPacket.addEventListener("input", () => {
      const val = dom.inputCustomRedPacket.value;
      if (dom.rpPresetChips) {
        dom.rpPresetChips.forEach(c => c.classList.toggle("active", c.dataset.amount === val));
      }
    });
  }
  if (dom.btnConfirmSendRedPacket) {
    dom.btnConfirmSendRedPacket.addEventListener("click", () => {
      const val = parseInt(dom.inputCustomRedPacket?.value) || 200;
      if (val < 100 || val > 50000) {
        alert("Số Xu phát lộc phải từ 100 đến 50,000 Xu!");
        return;
      }
      closeSendRedPacketModal();
      sendRedPacketAction(val);
    });
  }

  // Save admin live room config
  if (dom.btnSaveLiveRoomConfig) {
    dom.btnSaveLiveRoomConfig.addEventListener("click", saveLiveRoomConfigAction);
  }
}

function openSendRedPacketModal() {
  if (!dom.modalSendRedPacket) return;
  telegramEngine.haptic("medium");
  if (dom.rpModalBalanceVal) {
    dom.rpModalBalanceVal.textContent = (state.session?.balance || 0).toLocaleString() + " Xu";
  }
  if (dom.inputCustomRedPacket) {
    dom.inputCustomRedPacket.value = 200;
  }
  if (dom.rpPresetChips) {
    dom.rpPresetChips.forEach(c => c.classList.toggle("active", c.dataset.amount === "200"));
  }
  dom.modalSendRedPacket.style.display = "flex";
}

function closeSendRedPacketModal() {
  if (!dom.modalSendRedPacket) return;
  dom.modalSendRedPacket.style.display = "none";
}

function switchGameplayMode(mode) {
  state.gamePlayMode = mode;
  telegramEngine.haptic("selection");
  soundEngine.init();
  soundEngine.playChip();

  const isLive = mode === "live";
  if (dom.btnModeSolo) dom.btnModeSolo.classList.toggle("active", !isLive);
  if (dom.btnModeLive) dom.btnModeLive.classList.toggle("active", isLive);

  if (dom.liveRoundBanner) dom.liveRoundBanner.style.display = isLive ? "block" : "none";
  if (dom.liveRoomOnlinePill) dom.liveRoomOnlinePill.style.display = isLive ? "flex" : "none";

  const spinMain = dom.btnSpin ? dom.btnSpin.querySelector(".spin-main") : null;
  const spinSub = dom.btnSpin ? dom.btnSpin.querySelector(".spin-sub") : null;

  if (isLive) {
    if (spinMain) spinMain.textContent = "CƯỢC";
    if (spinSub) spinSub.textContent = "CONFIRM BET";
    showToast("👥 Đã vào <strong>PHÒNG TRỰC TIẾP</strong> (Phiên đồng bộ toàn server)", "gold");
    syncLiveRoomState();
    startLivePolling();
  } else {
    if (spinMain) spinMain.textContent = "QUAY";
    if (spinSub) spinSub.textContent = "SPIN";
    showToast("👤 Đã chuyển về <strong>CHƠI ĐƠN</strong> (Tự quay tự do)", "cyan");
    renderCommunityDoorBets({});
    stopLivePolling();
  }
}

function openChatDrawer() {
  if (!dom.chatDrawerBackdrop) return;
  dom.chatDrawerBackdrop.classList.add("open");
  document.body.classList.add("chat-drawer-open");
  telegramEngine.haptic("medium");
  if (dom.chatMessagesContainer) {
    dom.chatMessagesContainer.scrollTop = dom.chatMessagesContainer.scrollHeight;
  }
}

function closeChatDrawer() {
  if (!dom.chatDrawerBackdrop) return;
  dom.chatDrawerBackdrop.classList.remove("open");
  document.body.classList.remove("chat-drawer-open");
  telegramEngine.haptic("light");
}

function toggleLiveChat() {
  if (!dom.chatDrawerBackdrop) return;
  if (dom.chatDrawerBackdrop.classList.contains("open")) {
    closeChatDrawer();
  } else {
    openChatDrawer();
  }
}

let marqueePollTimer = null;
function startGlobalMarqueePolling() {
  if (marqueePollTimer) clearInterval(marqueePollTimer);
  fetchMarqueeData();
  marqueePollTimer = setInterval(fetchMarqueeData, 8000);
}

async function fetchMarqueeData() {
  try {
    const res = await fetch(`/api/live/state?user_id=${getLiveUserId()}&username=${encodeURIComponent(getLiveUserName())}`);
    const json = await res.json();
    if (json.status === "success" && json.data) {
      if (json.data.online_count) {
        if (dom.liveOnlineCount) dom.liveOnlineCount.textContent = json.data.online_count;
        if (dom.drawerOnlineCount) dom.drawerOnlineCount.textContent = json.data.online_count;
        if (dom.chatFloatingBadge) dom.chatFloatingBadge.textContent = `${json.data.online_count}`;
      }
      if (json.data.big_wins && json.data.big_wins.length > 0) {
        updateGlobalMarquee(json.data.big_wins);
      }
      if (json.data.config && json.data.config.live_room) {
        const sec = json.data.config.live_room.betting_time_sec || 30;
        if (dom.modeLiveSecLbl) dom.modeLiveSecLbl.textContent = `${sec}s`;
        if (dom.inputLiveBettingTime && document.activeElement !== dom.inputLiveBettingTime) {
          dom.inputLiveBettingTime.value = sec;
        }
      }
    }
  } catch (e) {}
}

function updateGlobalMarquee(bigWins) {
  if (!dom.marqueeText || !bigWins || bigWins.length === 0) return;
  const items = bigWins.map(bw => {
    return `<span>🔥 Chúc mừng <strong>${bw.username}</strong> vừa thắng lớn <strong>+${(bw.amount || 0).toLocaleString()} Xu</strong> (${bw.hand || "Chiến tích"})!</span>`;
  });
  items.push(`<span>👑 Quỹ Thần Tài tích lũy đang bùng nổ: <strong class="glow-gold">${(state.adminData?.jackpot?.current_pool || 35000).toLocaleString()} Xu</strong>!</span>`);
  dom.marqueeText.innerHTML = items.join("");
}

function startLivePolling() {
  if (state.livePollInterval) clearInterval(state.livePollInterval);
  if (state.liveCountdownInterval) clearInterval(state.liveCountdownInterval);

  state.livePollInterval = setInterval(syncLiveRoomState, 1500);
  state.liveCountdownInterval = setInterval(tickLiveCountdown, 1000);
}

function stopLivePolling() {
  if (state.livePollInterval) {
    clearInterval(state.livePollInterval);
    state.livePollInterval = null;
  }
  if (state.liveCountdownInterval) {
    clearInterval(state.liveCountdownInterval);
    state.liveCountdownInterval = null;
  }
  // Vẫn duy trì polling nhẹ (2.5s) cho chế độ CÁ NHÂN để người chơi luôn nhận Mưa Lì Xì và thông báo toàn server!
  state.livePollInterval = setInterval(syncLiveRoomState, 2500);
}

function tickLiveCountdown() {
  if (state.gamePlayMode !== "live") return;
  if (state.liveLocalTimeLeft > 0) {
    state.liveLocalTimeLeft--;
    if (dom.liveTimerVal) {
      dom.liveTimerVal.textContent = `${state.liveLocalTimeLeft}s`;
    }
    if (dom.liveProgressBar && state.liveRoundData) {
      const dur = state.liveRoundData.betting_duration_sec || 30;
      const pct = Math.max(0, Math.min(100, (state.liveLocalTimeLeft / dur) * 100));
      dom.liveProgressBar.style.width = `${pct}%`;
    }
  }
}

async function syncLiveRoomState() {
  try {
    const uid = getLiveUserId();
    const uname = getLiveUserName();
    const res = await fetch(`/api/live/state?user_id=${uid}&username=${encodeURIComponent(uname)}`);
    const json = await res.json();
    if (json.status !== "success" || !json.data) return;

    const data = json.data;
    state.liveRoundData = data.round;
    state.liveLocalTimeLeft = data.round.time_left_sec;

    // Update online count
    if (dom.liveOnlineCount) dom.liveOnlineCount.textContent = data.online_count;
    if (dom.drawerOnlineCount) dom.drawerOnlineCount.textContent = data.online_count;
    if (dom.chatFloatingBadge) dom.chatFloatingBadge.textContent = `${data.online_count}`;

    // Cập nhật giao diện bàn cược trực tiếp CHỈ KHI đang ở chế độ live
    if (state.gamePlayMode === "live") {
      updateLiveRoundUI(data.round, data.user_current_bet);

      // Process user settlement of previous round
      if (data.user_last_settlement) {
        handleLiveSettlement(data.user_last_settlement, data.user_balance);
      }

      // Cập nhật thống kê cược cộng đồng cả phòng
      if (data.community_stats) {
        if (dom.commPlayerCount) dom.commPlayerCount.textContent = data.community_stats.total_players || 0;
        if (dom.commTotalWagered) dom.commTotalWagered.textContent = (data.community_stats.total_wagered || 0).toLocaleString();
        renderCommunityDoorBets(data.community_stats.door_totals || {});
      }
    }

    // Cập nhật bảng vàng chạy chữ & thông báo nổ hũ toàn phòng
    if (data.big_wins && data.big_wins.length > 0) {
      updateGlobalMarquee(data.big_wins);
      const latestBw = data.big_wins[0];
      const now = Date.now();
      if (latestBw && (now - (latestBw.time || 0)) < 30000 && (latestBw.amount >= 5000 || (latestBw.hand && (latestBw.hand.includes("Ngũ Quý") || latestBw.hand.includes("Sảnh Chuẩn") || latestBw.hand.includes("Tứ Quý"))))) {
        if (!state.lastSeenJackpotId || state.lastSeenJackpotId !== latestBw.id) {
          state.lastSeenJackpotId = latestBw.id;
          showGlobalJackpotAlert(latestBw);
        }
      }
    }

    // Kích hoạt mưa lì xì nếu phòng có người phát lộc mới
    if (data.active_red_packets && data.active_red_packets.length > 0) {
      for (const rp of data.active_red_packets) {
        if (!state.activeRedPacketIdsSpawned.has(rp.id)) {
          state.activeRedPacketIdsSpawned.add(rp.id);
          triggerRedPacketRain(rp);
        }
      }
    }

  } catch (err) {
    console.error("Live state sync error:", err);
  }
}

function updateLiveRoundUI(round, userBet) {
  if (!round) return;

  if (dom.liveRoundId) dom.liveRoundId.textContent = round.round_id;
  if (dom.liveTimerVal) dom.liveTimerVal.textContent = `${round.time_left_sec}s`;

  if (dom.livePhaseBadge) {
    dom.livePhaseBadge.className = `lr-phase-badge ${round.phase}`;
  }

  const spinMain = dom.btnSpin ? dom.btnSpin.querySelector(".spin-main") : null;
  const spinSub = dom.btnSpin ? dom.btnSpin.querySelector(".spin-sub") : null;

  if (round.phase === "betting") {
    if (dom.livePhaseText) dom.livePhaseText.textContent = "ĐANG MỞ CƯỢC";
    if (dom.liveRoundHint) dom.liveRoundHint.textContent = "⏳ Hãy chọn chip đặt cược trước khi hết thời gian đếm ngược!";
    if (dom.btnSpin) dom.btnSpin.disabled = false;
    if (spinMain) spinMain.textContent = "CƯỢC";
    if (spinSub) spinSub.textContent = "CONFIRM BET";

    if (userBet) {
      if (dom.liveBetStatus) dom.liveBetStatus.textContent = `✅ Đã đặt cược ${userBet.total_bet} Xu`;
    } else {
      if (dom.liveBetStatus) dom.liveBetStatus.textContent = "Chưa đặt cược phiên này";
      // Chế độ AUTO ở chơi nhóm: Tự động đặt cược khi sang phiên mới
      if (state.isAutoSpin && !state.isSpinning && state.liveLastAutoBetRoundId !== round.round_id) {
        state.liveLastAutoBetRoundId = round.round_id;
        placeLiveBetAction();
      }
    }
  } else if (round.phase === "spinning") {
    if (dom.livePhaseText) dom.livePhaseText.textContent = "ĐANG QUAY CUỘN";
    if (dom.liveRoundHint) dom.liveRoundHint.textContent = "🌀 Toàn phòng đang quay chung 1 kết quả...";
    if (dom.btnSpin) dom.btnSpin.disabled = true;
    if (spinMain) spinMain.textContent = "ĐANG QUAY";
    if (spinSub) spinSub.textContent = "SPINNING...";

    // Trigger synchronized reel spin animation once per round
    if (round.outcome && state.liveLastSpunRoundId !== round.round_id) {
      state.liveLastSpunRoundId = round.round_id;
      executeLiveSpinReels(round.outcome);
    }
  } else if (round.phase === "payout") {
    if (dom.livePhaseText) dom.livePhaseText.textContent = "TRẢ THƯỞNG";
    if (dom.liveRoundHint) dom.liveRoundHint.textContent = "🏆 Kết quả đã công bố! Chuẩn bị sang phiên mới.";
    if (dom.btnSpin) dom.btnSpin.disabled = true;
    if (spinMain) spinMain.textContent = "KẾT QUẢ";
    if (spinSub) spinSub.textContent = "PAYOUT";
  }
}

async function executeLiveSpinReels(outcome) {
  if (!outcome || !outcome.grid) return;
  state.isSpinning = true;
  soundEngine.init();
  soundEngine.playSpin();

  const prevGrid = state.currentGrid || [
    [3, 8, 1, 6, 2],
    [7, 7, 7, 8, 9],
    [4, 5, 2, 9, 3]
  ];

  const grid = outcome.grid;
  const center_row = outcome.center_row;
  const analysis = outcome.analysis;

  dom.resHand.textContent = "ĐANG QUAY CHUNG CẢ PHÒNG...";
  clearWinningHighlights();
  dom.winPillsList.innerHTML = "";

  const reelPromises = [];
  for (let c = 0; c < 5; c++) {
    const p = new Promise(resolve => {
      const strip = document.getElementById(`reel-${c}`);
      if (!strip) return resolve();

      const targetNums = [grid[0][c], grid[1][c], grid[2][c]];
      const prevNums = [prevGrid[0][c], prevGrid[1][c], prevGrid[2][c]];
      const targetTop = targetNums[0];
      const prevTop = prevNums[0];

      let delta = (prevTop - targetTop) % 9;
      if (delta < 0) delta += 9;
      const fullLoops = 3 + c * 2;
      const totalItems = delta + fullLoops * 9 + 3;

      const stripNums = [];
      for (let i = 0; i < totalItems; i++) {
        stripNums.push(((targetTop - 1 + i) % 9) + 1);
      }

      strip.innerHTML = "";
      strip.style.transition = "none";
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

      const cellH = strip.firstElementChild ? strip.firstElementChild.offsetHeight : 110;
      const initialOffset = -((totalItems - 3) * cellH);
      strip.style.transform = `translateY(${initialOffset}px)`;
      const duration = 0.80 + c * 0.25;
      void strip.offsetHeight;

      strip.classList.add("strip-rolling");
      strip.style.transition = `transform ${duration}s cubic-bezier(0.12, 0.95, 0.25, 1.08)`;
      strip.style.transform = "translateY(0px)";

      setTimeout(() => {
        strip.classList.remove("strip-rolling");
        soundEngine.playReelStop();
        telegramEngine.haptic("rigid");
        renderReelStatic(c, targetNums);
        resolve();
      }, duration * 1000);
    });
    reelPromises.push(p);
  }

  await Promise.all(reelPromises);
  state.currentGrid = grid;
  state.isSpinning = false;

  // Display results on cabinet
  dom.resSum.textContent = `Tổng: ${analysis.sum}`;
  dom.resTaiXiu.textContent = analysis.is_tai ? "TÀI (26-45)" : (analysis.is_xiu ? "XỈU (5-24)" : "HÒA (25)");
  dom.resChanLe.textContent = analysis.is_chan ? "CHẴN" : "LẺ";
  dom.resHand.textContent = `Dãy: [ ${center_row.join(" - ")} ] ➔ ${analysis.hand_title_vi}`;

  // Record to history & update Soi Kèo
  state.historyData.unshift({
    spin: outcome.round_id,
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
    total_bet: 0,
    total_won: 0,
    net: 0
  });
  if (state.historyData.length > 100) state.historyData.pop();
  renderSoiKeo();
}

function handleLiveSettlement(settlement, newBalance) {
  if (!settlement || !settlement.payout) return;
  const payout = settlement.payout;
  if (newBalance !== undefined && state.session) {
    state.session.balance = newBalance;
    updateMeters(payout.total_won);
  }

  if (payout.total_won > 0) {
    soundEngine.playWin();
    telegramEngine.haptic("success");
    showToast(`🏆 <strong>PHIÊN ${settlement.round_id}</strong>: Bạn đã thắng <strong>+${payout.total_won.toLocaleString()} Xu</strong>!`, "gold");

    state.lastShareSlip = {
      round_id: settlement.round_id,
      amount: payout.total_won,
      hand: settlement.analysis?.hand_title_vi || "Thắng cược"
    };

    if (dom.shareWinContainer) {
      dom.shareWinContainer.style.display = "block";
      if (dom.quickShareWinText) {
        dom.quickShareWinText.textContent = `KHOE CHIẾN TÍCH (+${payout.total_won.toLocaleString()} Xu) LÊN PHÒNG CHAT`;
      }
    }

    if (payout.total_won >= (payout.total_bet || 10) * 5 && dom.winBanner) {
      soundEngine.playBigWin();
      telegramEngine.haptic("warning");
      dom.winBannerTitle.textContent = payout.total_won >= (payout.total_bet || 10) * 20 ? "JACKPOT / EPIC WIN!" : "BIG WIN!";
      dom.winBannerAmount.textContent = `+${payout.total_won.toFixed(2)}`;
      dom.winBannerDesc.textContent = `${settlement.analysis?.hand_title_vi} • Phiên Live: ${settlement.round_id}`;
      dom.winBanner.style.display = "block";
      dom.winBanner.classList.add("show");
    }
  } else {
    showToast(`Kết quả phiên ${settlement.round_id}: Không trúng. Chúc bạn may mắn phiên sau!`, "warn");
  }
}

async function placeLiveBetAction() {
  if (state.isSpinning) return;
  if (Object.keys(state.placedBets).length === 0) {
    state.placedBets["BASE_SPIN"] = 10.0;
    renderPlacedChips();
  }

  const totalBet = Object.values(state.placedBets).reduce((acc, v) => acc + v, 0);
  if (state.session && state.session.balance < totalBet) {
    telegramEngine.haptic("error");
    alert("Số dư của bạn không đủ cho tổng cược!");
    state.isAutoSpin = false;
    if (dom.btnAuto) {
      dom.btnAuto.classList.remove("active");
      dom.btnAuto.textContent = "🔄 AUTO (OFF)";
    }
    return;
  }

  try {
    const res = await fetch("/api/live/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getLiveUserId(),
        username: getLiveUserName(),
        bets: state.placedBets,
        bet_mode: state.fortuneBetMode === "fortune" ? "fortune_lock" : "free",
        locked_numbers: state.fortuneLockedNumbers
      })
    });
    const json = await res.json();
    if (json.status === "success") {
      state.session.balance = json.data.balance;
      updateMeters();
      telegramEngine.haptic("success");
      soundEngine.playWinTone();
      showToast(`⚡ Đã xác nhận cược <strong>${totalBet.toLocaleString()} Xu</strong> cho phiên <strong>${json.data.round_id}</strong>!`, "gold");
      if (dom.liveBetStatus) dom.liveBetStatus.textContent = `✅ Đã đặt cược ${totalBet.toLocaleString()} Xu`;
    } else {
      telegramEngine.haptic("error");
      showToast(`⚠️ ${json.detail || "Không thể đặt cược phiên này"}`, true);
      if (json.detail && (json.detail.includes("Số dư") || json.detail.includes("ít nhất"))) {
        state.isAutoSpin = false;
        if (dom.btnAuto) {
          dom.btnAuto.classList.remove("active");
          dom.btnAuto.textContent = "🔄 AUTO (OFF)";
        }
      }
    }
  } catch (err) {
    console.error("Live bet error:", err);
  }
}

async function sendChatMessage(text) {
  try {
    const res = await fetch("/api/live/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getLiveUserId(),
        username: getLiveUserName(),
        avatar: telegramEngine.tg?.initDataUnsafe?.user?.photo_url ? "⭐️" : "👤",
        text: text
      })
    });
    const json = await res.json();
    if (json.status === "success") {
      syncLiveRoomState();
    }
  } catch (e) {}
}

async function sendReaction(emoji, originX) {
  try {
    spawnFloatingEmoji(emoji, originX);
    soundEngine.init();
    soundEngine.playChip();
    telegramEngine.haptic("light");
    await fetch("/api/live/reaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji })
    });
  } catch (e) {}
}

function spawnFloatingEmoji(emoji, originX) {
  if (!dom.floatingEmojisLayer) return;
  const span = document.createElement("span");
  span.className = "floating-emoji-item";
  span.textContent = emoji;

  let leftPercent;
  if (originX !== undefined && typeof originX === "number" && originX > 0) {
    leftPercent = Math.max(8, Math.min(88, (originX / window.innerWidth) * 100));
  } else {
    leftPercent = 12 + Math.random() * 76;
  }
  span.style.left = `${leftPercent}%`;
  dom.floatingEmojisLayer.appendChild(span);
  setTimeout(() => span.remove(), 2400);
}

function shareWinSlipAction() {
  const slip = state.lastShareSlip;
  if (!slip) {
    showToast("Bạn chưa có chiến tích mới để khoe!", "warn");
    return;
  }

  // Open modern chat drawer
  openChatDrawer();

  // Burst celebratory emojis
  spawnFloatingEmoji("💰");
  setTimeout(() => spawnFloatingEmoji("🎉"), 150);
  setTimeout(() => spawnFloatingEmoji("👑"), 300);

  const shareText = `🔥 Vừa húp trọn +${slip.amount.toLocaleString()} Xu (${slip.hand}) ở phiên ${slip.round_id}!`;
  fetch("/api/live/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: getLiveUserId(),
      username: getLiveUserName(),
      avatar: "🏆",
      text: shareText,
      type: "win_share",
      slip: slip
    })
  }).then(() => {
    soundEngine.playWinTone();
    telegramEngine.haptic("success");
    showToast("📢 Đã khoe chiến tích rực rỡ lên phòng chat!", "gold");
    if (dom.shareWinContainer) {
      dom.shareWinContainer.style.display = "none";
    }
    syncLiveRoomState();
  });
}

function renderChatMessages(messages) {
  if (!dom.chatMessagesContainer || !messages) return;
  // Sắp xếp tin nhắn: tin cũ ở trên, tin mới nhất ở dưới đáy
  const sorted = [...messages].sort((a, b) => (a.time || 0) - (b.time || 0));

  dom.chatMessagesContainer.innerHTML = sorted.map(msg => {
    const isSys = msg.type === "system";
    const isWinShare = msg.type === "win_share" || !!msg.slip;
    const isRedPacket = msg.type === "red_packet" || !!msg.packet_id;
    const timeStr = msg.time ? new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    let slipHtml = "";
    if (msg.slip) {
      slipHtml = `
        <div class="chat-win-slip">
          <span class="cws-title">🏆 THẺ CHIẾN TÍCH: ${msg.slip.hand || "THẮNG LỚN"}</span>
          <span class="cws-amt">+${(msg.slip.amount || 0).toLocaleString()} Xu</span>
        </div>
      `;
    }
    let rpBtnHtml = "";
    if (isRedPacket && msg.packet_id) {
      rpBtnHtml = `
        <div>
          <button class="chat-claim-packet-btn" data-packet-id="${msg.packet_id}">
            🧧 BẤM NHẬN LỘC NGAY
          </button>
        </div>
      `;
    }
    return `
      <div class="chat-msg-row ${isSys ? "system" : ""} ${isWinShare ? "win-share" : ""} ${isRedPacket ? "red-packet-msg" : ""}">
        <span class="chat-msg-avatar">${msg.avatar || "👤"}</span>
        <div class="chat-msg-content">
          <div class="chat-msg-header">
            <span class="chat-msg-author">${msg.username || "Thành viên"}</span>
            ${timeStr ? `<span class="chat-msg-time">${timeStr}</span>` : ""}
          </div>
          <span class="chat-msg-text">${msg.text || ""}</span>
          ${slipHtml}
          ${rpBtnHtml}
        </div>
      </div>
    `;
  }).join("");

  // Gắn sự kiện bấm nhận lộc trực tiếp từ khung chat
  dom.chatMessagesContainer.querySelectorAll(".chat-claim-packet-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const pId = btn.dataset.packetId;
      if (pId) {
        claimRedPacketAction(pId, btn);
      }
    });
  });

  // Tự động cuộn xuống đáy để xem tin nhắn mới nhất
  dom.chatMessagesContainer.scrollTop = dom.chatMessagesContainer.scrollHeight;
}

async function saveLiveRoomConfigAction() {
  if (!dom.inputLiveBettingTime) return;
  const sec = parseInt(dom.inputLiveBettingTime.value) || 30;
  if (sec < 10 || sec > 180) {
    alert("Thời gian cược phải từ 10 đến 180 giây!");
    return;
  }

  try {
    telegramEngine.haptic("medium");
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        live_room: { betting_time_sec: sec }
      })
    });
    const json = await res.json();
    if (json.status === "success") {
      if (dom.saveLiveRoomMsg) {
        dom.saveLiveRoomMsg.textContent = "✅ Đã lưu thời gian cược " + sec + "s thành công!";
        dom.saveLiveRoomMsg.className = "adm-save-msg show success";
        setTimeout(() => { dom.saveLiveRoomMsg.className = "adm-save-msg"; }, 3500);
      }
      if (dom.modeLiveSecLbl) dom.modeLiveSecLbl.textContent = `${sec}s`;
      showToast(`⚙️ Đã cập nhật thời gian cược Live Room thành <strong>${sec} giây</strong>`, "gold");
    }
  } catch (err) {
    console.error("Save live room error:", err);
  }
}

function renderCommunityDoorBets(doorTotals) {
  if (state.gamePlayMode !== "live") {
    document.querySelectorAll(".door-community-tag").forEach(el => el.remove());
    return;
  }
  if (!dom.betCells) return;
  dom.betCells.forEach(cell => {
    const doorKey = cell.dataset.bet;
    let tag = cell.querySelector(".door-community-tag");
    const amt = doorTotals ? (doorTotals[doorKey] || 0) : 0;
    if (amt > 0) {
      const text = `👥 ${(amt >= 1000 ? (amt / 1000).toFixed(1) + "k" : amt)}`;
      if (!tag) {
        tag = document.createElement("span");
        tag.className = "door-community-tag";
        cell.appendChild(tag);
      }
      tag.textContent = text;
    } else if (tag) {
      tag.remove();
    }
  });
}

let redPacketRainTimeout = null;

function dismissRedPacketRain() {
  if (!dom.redPacketRainLayer) return;
  if (redPacketRainTimeout) {
    clearTimeout(redPacketRainTimeout);
    redPacketRainTimeout = null;
  }
  dom.redPacketRainLayer.classList.remove("active");
  setTimeout(() => {
    dom.redPacketRainLayer.innerHTML = "";
  }, 300);
}

function triggerRedPacketRain(packet) {
  if (!dom.redPacketRainLayer) return;
  soundEngine.init();
  soundEngine.playWinTone();
  telegramEngine.haptic("warning");
  showToast(`🧧 <strong>${packet.sender_name}</strong> vừa PHÁT LỘC <strong>${(packet.total_amount || 200).toLocaleString()} Xu</strong>! Mau nhặt bao lì xì!`, "gold");

  // Kích hoạt lớp phủ chống chạm nhầm xuống bàn cược
  dom.redPacketRainLayer.innerHTML = "";
  dom.redPacketRainLayer.classList.add("active");

  // Header lễ hội trên đỉnh
  const headerEl = document.createElement("div");
  headerEl.className = "rp-rain-header";
  headerEl.innerHTML = `
    <span class="rp-rain-title">🧧 MƯA LÌ XÌ PHÁT LỘC! 🧧</span>
    <span class="rp-rain-sub">Lộc từ ${packet.sender_name} • Chạm bao lì xì hoặc bấm nút dưới</span>
  `;
  dom.redPacketRainLayer.appendChild(headerEl);

  // Thanh nút bấm nhận nhanh bên dưới màn hình
  const quickWrap = document.createElement("div");
  quickWrap.className = "rp-quick-claim-wrap";
  quickWrap.innerHTML = `
    <button class="rp-quick-claim-btn" id="btnQuickClaimRain">
      <span>🧧</span> <span>BẤM NHẬN LỘC NGAY (+Xu)</span>
    </button>
    <span class="rp-dismiss-hint" id="btnDismissRain">Đóng lại / Bỏ qua</span>
  `;
  dom.redPacketRainLayer.appendChild(quickWrap);

  const quickBtn = quickWrap.querySelector("#btnQuickClaimRain");
  if (quickBtn) {
    quickBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      claimRedPacketAction(packet.id, quickBtn);
    });
  }

  const dismissBtn = quickWrap.querySelector("#btnDismissRain");
  if (dismissBtn) {
    dismissBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismissRedPacketRain();
    });
  }

  // Bắt sự kiện chạm trên toàn màn hình: Tự động hít/bắt dính bao lì xì gần nhất (Bán kính thông minh 140px)
  const onLayerPointer = (e) => {
    if (e.target.closest(".falling-red-packet") || e.target.closest(".rp-quick-claim-wrap") || e.target.closest(".rp-rain-header")) {
      return;
    }
    const unclaimed = dom.redPacketRainLayer.querySelectorAll(".falling-red-packet:not([data-claimed])");
    let closest = null;
    let minD = 140;
    unclaimed.forEach(p => {
      const rect = p.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < minD) {
        minD = dist;
        closest = p;
      }
    });
    if (closest) {
      claimRedPacketAction(packet.id, closest);
    }
  };
  dom.redPacketRainLayer.addEventListener("pointerdown", onLayerPointer);

  const packetCount = 14;
  for (let i = 0; i < packetCount; i++) {
    const el = document.createElement("div");
    el.className = "falling-red-packet";
    el.innerHTML = `
      <span class="rp-icon">🧧</span>
      <span class="rp-text">LỘC</span>
    `;

    const startX = 6 + Math.random() * 88;
    const delay = Math.random() * 1.6;
    const duration = 3.8 + Math.random() * 1.6;

    el.style.left = `${startX}%`;
    el.style.animationDelay = `${delay}s`;
    el.style.animationDuration = `${duration}s`;

    const handleClaim = (e) => {
      e.preventDefault();
      e.stopPropagation();
      claimRedPacketAction(packet.id, el);
    };

    el.addEventListener("pointerdown", handleClaim, { passive: false });
    el.addEventListener("touchstart", handleClaim, { passive: false });

    dom.redPacketRainLayer.appendChild(el);
  }

  // Tự động đóng lớp mưa lì xì sau 7 giây
  if (redPacketRainTimeout) clearTimeout(redPacketRainTimeout);
  redPacketRainTimeout = setTimeout(() => {
    dismissRedPacketRain();
  }, 7000);
}

async function claimRedPacketAction(packetId, el) {
  if (el && el.dataset && el.dataset.claimed) return;
  if (el && el.dataset) el.dataset.claimed = "true";
  if (el && el.classList && el.classList.contains("falling-red-packet")) {
    el.classList.add("claimed");
  }

  try {
    telegramEngine.haptic("success");
    soundEngine.playWin();
    const res = await fetch("/api/live/redpacket/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packet_id: packetId,
        user_id: getLiveUserId(),
        username: getLiveUserName()
      })
    });
    const json = await res.json();
    if (json.status === "success") {
      state.session.balance = json.data.balance;
      updateMeters(json.data.amount);
      soundEngine.playWinTone();
      showToast(`🧧 <strong>CHÚC MỪNG!</strong> Bạn vừa nhặt được <strong>+${json.data.amount} Xu</strong> lộc từ <strong>${json.data.sender_name}</strong>!`, "gold");
      spawnFloatingEmoji("💰");
      setTimeout(() => dismissRedPacketRain(), 1000);
    } else {
      showToast(`🧧 ${json.detail || "Đã có người nhặt trước!"}`, "warn");
      setTimeout(() => dismissRedPacketRain(), 1200);
    }
  } catch (err) {
    console.error("Claim red packet error:", err);
  }
}

async function sendRedPacketAction(amount = 200) {
  if (state.session && state.session.balance < amount) {
    telegramEngine.haptic("error");
    alert(`Số dư của bạn không đủ để phát lộc ${amount} Xu!`);
    return;
  }

  const confirmSend = confirm(`Bạn có chắc muốn trích ${amount.toLocaleString()} Xu từ số dư để phát lộc cho tất cả người chơi trong phòng?`);
  if (!confirmSend) return;

  try {
    telegramEngine.haptic("medium");
    const res = await fetch("/api/live/redpacket/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getLiveUserId(),
        username: getLiveUserName(),
        amount: amount
      })
    });
    const json = await res.json();
    if (json.status === "success") {
      state.session.balance = json.data.balance;
      updateMeters();
      soundEngine.playWinTone();
      telegramEngine.haptic("success");
      showToast(`🧧 Bạn đã phát lộc <strong>${amount.toLocaleString()} Xu</strong> cho cả phòng thành công!`, "gold");
      triggerRedPacketRain(json.data.packet);
      syncLiveRoomState();
    } else {
      showToast(`⚠️ ${json.detail || "Không thể phát lộc"}`, true);
    }
  } catch (err) {
    console.error("Send red packet error:", err);
  }
}

function shareToTelegram(text, url) {
  telegramEngine.haptic("medium");
  const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(url || window.location.href) + "&text=" + encodeURIComponent(text);
  if (telegramEngine.tg && typeof telegramEngine.tg.openTelegramLink === "function") {
    telegramEngine.tg.openTelegramLink(shareUrl);
  } else {
    if (navigator.share) {
      navigator.share({ title: "Lucky Numbers 777", text: text, url: url || window.location.href }).catch(() => {});
    } else {
      window.open(shareUrl, "_blank");
    }
  }
}

function handleInviteFriends() {
  const text = "🎰 Đang có rất nhiều cao thủ cược trực tiếp tại Lucky Numbers 777! Vào phòng cược chung và săn Hũ Thần Tài cùng tôi nhé:";
  const url = "https://t.me/relicspin_bot?startapp=live";
  shareToTelegram(text, url);
  showToast("👥 Đang mở chia sẻ Telegram để mời bạn bè...", "info");
}

function handleShareWinToTelegram() {
  const slip = state.lastShareSlip;
  if (!slip) {
    showToast("Bạn chưa có chiến tích mới để chia sẻ!", "warn");
    return;
  }
  const text = `🔥 Tôi vừa thắng lớn +${(slip.amount || 0).toLocaleString()} Xu (${slip.hand || "Chiến tích"}) tại Lucky Numbers 777! Vào cùng chiến ngay:`;
  const url = "https://t.me/relicspin_bot?startapp=win";
  shareToTelegram(text, url);
  showToast("✈️ Đang mở chia sẻ chiến tích lên Telegram...", "gold");
}

function showGlobalJackpotAlert(bw) {
  if (!dom.globalJackpotAlert) return;
  soundEngine.playBigWin();
  telegramEngine.haptic("warning");
  if (dom.gjaDesc) dom.gjaDesc.textContent = `Người chơi @${bw.username} vừa trúng ${bw.hand || "NỔ HŨ"}!`;
  if (dom.gjaAmt) dom.gjaAmt.textContent = `+${(bw.amount || 0).toLocaleString()} Xu`;
  dom.globalJackpotAlert.style.display = "block";
  dom.globalJackpotAlert.classList.add("show");
  spawnFloatingEmoji("👑");
  setTimeout(() => spawnFloatingEmoji("💰"), 200);
  setTimeout(() => spawnFloatingEmoji("🎉"), 400);

  setTimeout(() => {
    dom.globalJackpotAlert.classList.remove("show");
    setTimeout(() => {
      dom.globalJackpotAlert.style.display = "none";
    }, 500);
  }, 4500);
}

window.addEventListener("DOMContentLoaded", init);

