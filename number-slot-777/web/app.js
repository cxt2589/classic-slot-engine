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
  seenReactionIds: new Set(),
  activeRedPacketIdsSpawned: new Set(),
  lastSeenJackpotId: null,
  vipInfo: null,
  userProfile: {
    equippedTitle: (typeof localStorage !== "undefined" && localStorage.getItem("lucky_user_title")) || "🍀 Tân Thủ May Mắn",
    unlockedTitles: new Set(["🍀 Tân Thủ May Mắn"])
  },
  leaderboardData: null,
  currentLbTab: "winners",

  // Custom & Telegram Private Room System
  currentRoomId: (typeof localStorage !== "undefined" && localStorage.getItem("lucky_current_room")) || "public",
  recentRooms: (typeof localStorage !== "undefined" && localStorage.getItem("lucky_recent_rooms") ? JSON.parse(localStorage.getItem("lucky_recent_rooms")) : []),
  currentRoomInfo: null
};

const lottoState = {
  currentChannel: "60s",
  currentRound: null,
  activeSubtab: "so", // "so" | "nhanh"
  selectedBetType: "DE_DUOI", // "DE_DUOI" | "DE_DAU" | "BA_CANG"
  matrixDigits: {
    tram: null,
    chuc: null,
    donVi: null
  },
  selectedNumbers: new Set(),
  fastBets: {
    TAI: 0,
    XIU: 0,
    CHAN: 0,
    LE: 0,
    KEP_BANG: 0
  },
  currentChip: 10,
  pollTimer: null,
  lastSettledRoundId: null,
  lastDrawnRoundId: null,
  isSpinningReels: false,
  currentActiveTicket: null
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

      // Telegram User profile display: Đồng bộ trực tiếp vào playerVipPill
      const user = this.tg.initDataUnsafe?.user;
      if (user) {
        const displayName = user.username ? `@${user.username}` : (user.first_name || "Thành viên");
        if (dom.pvName) dom.pvName.textContent = displayName;
        if (dom.pvAvatar) dom.pvAvatar.textContent = user.photo_url ? "⭐️" : "👤";
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
  btnModeLotto: document.getElementById("btnModeLotto"),
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
  btnCloseShareWin: document.getElementById("btnCloseShareWin"),
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
  btnDrawerLeaderboard: document.getElementById("btnDrawerLeaderboard"),
  btnHeaderLeaderboard: document.getElementById("btnHeaderLeaderboard"),

  // Custom & Telegram Private Room Elements
  btnOpenRoomModal: document.getElementById("btnOpenRoomModal"),
  roomSelectorIcon: document.getElementById("roomSelectorIcon"),
  roomSelectorName: document.getElementById("roomSelectorName"),
  liveRoundRoomTag: document.getElementById("liveRoundRoomTag"),
  chatDrawerTitle: document.getElementById("chatDrawerTitle"),
  chatDrawerIcon: document.getElementById("chatDrawerIcon"),
  drawerRoomName: document.getElementById("drawerRoomName"),
  btnDrawerSwitchRoom: document.getElementById("btnDrawerSwitchRoom"),
  modalCustomRoom: document.getElementById("modalCustomRoom"),
  btnCloseRoomModal: document.getElementById("btnCloseRoomModal"),
  currentRoomCard: document.getElementById("currentRoomCard"),
  crcBadge: document.getElementById("crcBadge"),
  crcOnlineCount: document.getElementById("crcOnlineCount"),
  crcCodeVal: document.getElementById("crcCodeVal"),
  crcDesc: document.getElementById("crcDesc"),
  btnRoomShareTg: document.getElementById("btnRoomShareTg"),
  btnRoomCopyLink: document.getElementById("btnRoomCopyLink"),
  btnLeavePrivateRoom: document.getElementById("btnLeavePrivateRoom"),
  inputRoomCode: document.getElementById("inputRoomCode"),
  btnRandomRoomCode: document.getElementById("btnRandomRoomCode"),
  btnJoinRoomSubmit: document.getElementById("btnJoinRoomSubmit"),
  recentRoomsSection: document.getElementById("recentRoomsSection"),
  recentRoomsList: document.getElementById("recentRoomsList"),
  btnClearRecentRooms: document.getElementById("btnClearRecentRooms"),
  btnRoomAddBotToGroup: document.getElementById("btnRoomAddBotToGroup"),
  btnCopyLinkRoomCommand: document.getElementById("btnCopyLinkRoomCommand"),
  btnTestBotBroadcast: document.getElementById("btnTestBotBroadcast"),
  tbiCmdText: document.getElementById("tbiCmdText"),

  // Player VIP & Profile Elements
  playerVipPill: document.getElementById("playerVipPill"),
  pvAvatar: document.getElementById("pvAvatar"),
  pvVipIcon: document.getElementById("pvVipIcon"),
  pvName: document.getElementById("pvName"),
  pvTitleBadge: document.getElementById("pvTitleBadge"),
  modalPlayerProfile: document.getElementById("modalPlayerProfile"),
  btnCloseProfileModal: document.getElementById("btnCloseProfileModal"),
  profAvatarIcon: document.getElementById("profAvatarIcon"),
  profVipTag: document.getElementById("profVipTag"),
  profName: document.getElementById("profName"),
  profId: document.getElementById("profId"),
  profLevelName: document.getElementById("profLevelName"),
  profExpFill: document.getElementById("profExpFill"),
  profExpTxt: document.getElementById("profExpTxt"),
  profExpPct: document.getElementById("profExpPct"),
  profileTitlesGrid: document.getElementById("profileTitlesGrid"),
  inputCustomUname: document.getElementById("inputCustomUname"),
  btnSaveCustomUname: document.getElementById("btnSaveCustomUname"),
  pncStatusBadge: document.getElementById("pncStatusBadge"),
  pncHintTxt: document.getElementById("pncHintTxt"),

  // Live Roadmap Card
  liveRoadmapCard: document.getElementById("liveRoadmapCard"),
  roadmapBeadsTrack: document.getElementById("roadmapBeadsTrack"),
  rmPctTai: document.getElementById("rmPctTai"),
  rmPctXiu: document.getElementById("rmPctXiu"),
  rmStreakTag: document.getElementById("rmStreakTag"),

  // Leaderboard Elements
  modalLeaderboard: document.getElementById("modalLeaderboard"),
  btnCloseLeaderboard: document.getElementById("btnCloseLeaderboard"),
  lbTabWinners: document.getElementById("lbTabWinners"),
  lbTabDonors: document.getElementById("lbTabDonors"),
  lbBodyContainer: document.getElementById("lbBodyContainer"),

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

  // Betting Boards (Slot vs Lotto)
  slotBettingBoard: document.getElementById("slotBettingBoard"),
  lottoBettingBoard: document.getElementById("lottoBettingBoard"),

  // Turbo 5D Lotto Elements
  lottoChannelsBar: document.getElementById("lottoChannelsBar"),
  lottoRoundId: document.getElementById("lottoRoundId"),
  lottoChannelBadge: document.getElementById("lottoChannelBadge"),
  lottoPhasePill: document.getElementById("lottoPhasePill"),
  lottoPhaseText: document.getElementById("lottoPhaseText"),
  lottoTimerVal: document.getElementById("lottoTimerVal"),
  lottoProgressBar: document.getElementById("lottoProgressBar"),
  btnSubtabSo: document.getElementById("btnSubtabSo"),
  btnSubtabNhanh: document.getElementById("btnSubtabNhanh"),
  paneLottoSo: document.getElementById("paneLottoSo"),
  paneLottoNhanh: document.getElementById("paneLottoNhanh"),
  lmsRowTram: document.getElementById("lmsRowTram"),
  lmsRowChuc: document.getElementById("lmsRowChuc"),
  lmsRowDonVi: document.getElementById("lmsRowDonVi"),
  lmsDigitsTram: document.getElementById("lmsDigitsTram"),
  lmsDigitsChuc: document.getElementById("lmsDigitsChuc"),
  lmsDigitsDonVi: document.getElementById("lmsDigitsDonVi"),
  inputLottoCustomNumbers: document.getElementById("inputLottoCustomNumbers"),
  btnAddCustomNumbers: document.getElementById("btnAddCustomNumbers"),
  btnLottoRandNumber: document.getElementById("btnLottoRandNumber"),
  btnLottoKepBang: document.getElementById("btnLottoKepBang"),
  btnLottoDauChan: document.getElementById("btnLottoDauChan"),
  btnLottoDauLe: document.getElementById("btnLottoDauLe"),
  btnLottoClearNumbers: document.getElementById("btnLottoClearNumbers"),
  lstCount: document.getElementById("lstCount"),
  lstEstWager: document.getElementById("lstEstWager"),
  lstChipsWrap: document.getElementById("lstChipsWrap"),
  lottoChipsSelector: document.getElementById("lottoChipsSelector"),
  btnLottoAllIn: document.getElementById("btnLottoAllIn"),
  lottoTotalWagerVal: document.getElementById("lottoTotalWagerVal"),
  btnSubmitLottoTicket: document.getElementById("btnSubmitLottoTicket"),
  lottoRoadmapCard: document.getElementById("lottoRoadmapCard"),
  lrcChannelNote: document.getElementById("lrcChannelNote"),
  lottoRoadmapTable: document.getElementById("lottoRoadmapTable"),
  lottoRoadmapBody: document.getElementById("lottoRoadmapBody"),

  // Placed Lotto Ticket Card & Badge
  lottoMyTicketBadge: document.getElementById("lottoMyTicketBadge"),
  lottoMyTicketBadgeVal: document.getElementById("lottoMyTicketBadgeVal"),
  lottoActiveTicketCard: document.getElementById("lottoActiveTicketCard"),
  latPhaseBadge: document.getElementById("latPhaseBadge"),
  latTotalWager: document.getElementById("latTotalWager"),
  latBody: document.getElementById("latBody")
};

// Colors mapping (0-9 for 5D lotto & slot numbers)
const NUMBER_COLORS = {
  0: "#E040FB",
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
  initRoomSystem(); // Giai đoạn 2: Khởi tạo phòng riêng & Telegram Deep Links
  initLottoSystem(); // Giai đoạn 3: Hệ thống Xổ Số Nhanh 5D
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
  if (!topNav) return;

  let ticking = false;
  let isDesktopSticky = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const isMobile = window.innerWidth <= 768;

        if (!isMobile) {
          // Desktop mode with hysteresis:
          if (scrollY > 60 && !isDesktopSticky) {
            isDesktopSticky = true;
            topNav.classList.add("is-sticky-desktop");
          } else if (scrollY < 15 && isDesktopSticky) {
            isDesktopSticky = false;
            topNav.classList.remove("is-sticky-desktop");
          }
        } else {
          if (isDesktopSticky) {
            isDesktopSticky = false;
            topNav.classList.remove("is-sticky-desktop");
          }
        }

        ticking = false;
      });
      ticking = true;
    }
  }

  window.recheckScrollNav = () => {
    isDesktopSticky = false;
    onScroll();
  };

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

      // Khôi phục tổng tiền cược tích lũy trọn đời (Bảo lưu VIP)
      const uidKey = tgUserId ? `tg_wagered_${tgUserId}` : `lucky_lifetime_wagered_${getLiveUserId()}`;
      const savedWagered = localStorage.getItem(uidKey) || localStorage.getItem("lucky_lifetime_wagered");
      if (savedWagered !== null && !isNaN(parseFloat(savedWagered))) {
        state.session.total_wagered = Math.max(state.session.total_wagered || 0, parseFloat(savedWagered));
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
  const totalWager = state.gamePlayMode === "lotto"
    ? (lottoState.currentActiveTicket?.total_bet || 0)
    : Object.values(state.placedBets).reduce((acc, v) => acc + v, 0);
  dom.meterTotalBet.textContent = totalWager.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (lastWin > 0) {
    dom.meterWin.textContent = lastWin.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Persist balance & lifetime wagered for user
  const tgUserId = telegramEngine.tg?.initDataUnsafe?.user?.id;
  if (tgUserId && state.session?.balance !== undefined) {
    localStorage.setItem(`tg_balance_${tgUserId}`, state.session.balance);
  }
  if (state.session?.total_wagered !== undefined) {
    const uidKey = tgUserId ? `tg_wagered_${tgUserId}` : `lucky_lifetime_wagered_${getLiveUserId()}`;
    const curSaved = parseFloat(localStorage.getItem(uidKey)) || 0;
    if (state.session.total_wagered > curSaved) {
      localStorage.setItem(uidKey, state.session.total_wagered);
      localStorage.setItem("lucky_lifetime_wagered", state.session.total_wagered);
    } else if (curSaved > state.session.total_wagered) {
      state.session.total_wagered = curSaved;
    }
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
        showToast("💰 Đã nhận thêm +10,000 Xu miễn phí! Cấp bậc VIP được giữ nguyên.", "gold");
      }
    });
  }

  dom.btnResetBalance.addEventListener("click", async () => {
    try {
      telegramEngine.haptic("medium");
      const currentWagered = (state.session && state.session.total_wagered) || 0;
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initial_balance: 10000.0 })
      });
      const json = await res.json();
      if (json.status === "success") {
        state.session = json.data;
        // Bảo lưu 100% tổng cược tích lũy để không bao giờ bị hạ cấp VIP
        state.session.total_wagered = Math.max(json.data.total_wagered || 0, currentWagered);
        const tgUserId = telegramEngine.tg?.initDataUnsafe?.user?.id;
        const uidKey = tgUserId ? `tg_wagered_${tgUserId}` : `lucky_lifetime_wagered_${getLiveUserId()}`;
        localStorage.setItem(uidKey, state.session.total_wagered);
        localStorage.setItem("lucky_lifetime_wagered", state.session.total_wagered);

        state.historyData = json.data.history || [];
        updateMeters();
        renderSoiKeo();
        syncLiveRoomState();
        showToast("💰 Đã nạp lại số dư 10,000 Xu! Cấp bậc VIP & Tổng cược được bảo lưu nguyên vẹn.", "gold");
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
  if (state.gamePlayMode === "lotto") {
    await submitLottoTicket();
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
  const customName = localStorage.getItem("lucky_custom_uname");
  if (customName) return customName;

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

// ==========================================
// GIAI ĐOẠN 2: PHÒNG CHƠI RIÊNG CHO HỘI BẠN & TELEGRAM GROUP
// ==========================================

function normalizeRoomIdClient(raw) {
  if (!raw || typeof raw !== "string") return "public";
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  return cleaned ? cleaned.slice(0, 20) : "public";
}

function updateRoomUI() {
  const roomId = normalizeRoomIdClient(state.currentRoomId);
  const isPrivate = roomId !== "public";

  // Update Game Mode Bar Button
  if (dom.btnOpenRoomModal) {
    dom.btnOpenRoomModal.classList.toggle("is-private", isPrivate);
  }
  if (dom.roomSelectorIcon) {
    dom.roomSelectorIcon.textContent = isPrivate ? "🔒" : "🌐";
  }
  if (dom.roomSelectorName) {
    dom.roomSelectorName.textContent = isPrivate ? `#${roomId}` : "Toàn Server";
  }

  // Update Live Round Banner Tag
  if (dom.liveRoundRoomTag) {
    dom.liveRoundRoomTag.textContent = isPrivate ? `🔒 #${roomId}` : "🌐 Toàn Server";
    dom.liveRoundRoomTag.classList.toggle("is-private", isPrivate);
  }

  // Update Chat Drawer Header Info
  if (dom.chatDrawerTitle) {
    dom.chatDrawerTitle.textContent = isPrivate ? `PHÒNG CHAT #${roomId}` : "PHÒNG CHAT TRỰC TIẾP";
  }
  if (dom.chatDrawerIcon) {
    dom.chatDrawerIcon.textContent = isPrivate ? "🔒" : "💬";
  }
  if (dom.drawerRoomName) {
    dom.drawerRoomName.textContent = isPrivate ? `Phòng #${roomId}` : "Toàn Server";
  }

  // Update Modal Room Card
  if (dom.crcBadge) {
    dom.crcBadge.textContent = isPrivate ? `🔒 PHÒNG RIÊNG` : "🌐 PHÒNG TOÀN SERVER";
    dom.crcBadge.classList.toggle("is-private", isPrivate);
  }
  if (dom.crcCodeVal) {
    dom.crcCodeVal.textContent = isPrivate ? `#${roomId}` : "PUBLIC";
  }
  if (dom.crcDesc) {
    dom.crcDesc.textContent = isPrivate
      ? `Bạn đang ở phòng riêng #${roomId}. Tất cả bạn bè trong phòng nhận kết quả quay đồng nhất 100%, trò chuyện nội bộ và chia sẻ lì xì kín.`
      : "Bạn đang ở phòng chung toàn server. Cùng hàng trăm người chơi cược chung, chat chung và săn hũ chung.";
  }
  if (dom.btnLeavePrivateRoom) {
    dom.btnLeavePrivateRoom.style.display = isPrivate ? "inline-flex" : "none";
  }
  if (dom.currentRoomCard) {
    dom.currentRoomCard.classList.toggle("is-private", isPrivate);
  }
  if (dom.tbiCmdText) {
    dom.tbiCmdText.textContent = `/link_room ${roomId}`;
  }
}

function joinRoom(rawRoomId, silent = false) {
  const targetRoom = normalizeRoomIdClient(rawRoomId);
  const prevRoom = state.currentRoomId;

  if (targetRoom !== prevRoom) {
    // Clear chat cache to load fresh room messages
    state.chatMessagesCache = [];
  }

  state.currentRoomId = targetRoom;
  try {
    localStorage.setItem("lucky_current_room", targetRoom);
  } catch (e) {}

  // Save to recent rooms
  if (targetRoom !== "public") {
    let recent = Array.isArray(state.recentRooms) ? [...state.recentRooms] : [];
    recent = recent.filter(r => r !== targetRoom);
    recent.unshift(targetRoom);
    state.recentRooms = recent.slice(0, 8);
    try {
      localStorage.setItem("lucky_recent_rooms", JSON.stringify(state.recentRooms));
    } catch (e) {}
  }

  updateRoomUI();
  renderRecentRooms();

  if (state.gamePlayMode !== "live") {
    switchGameplayMode("live");
  } else {
    syncLiveRoomState();
  }

  closeRoomModal();

  if (!silent) {
    soundEngine.playWinTone();
    telegramEngine.haptic("success");
    if (targetRoom === "public") {
      showToast("🌐 Bạn đã trở về <strong>Phòng Toàn Server</strong>!", "cyan");
    } else {
      showToast(`🔒 Đã vào <strong>Phòng Riêng #${targetRoom}</strong>! Kết quả & kênh chat đã đồng bộ cho nhóm của bạn.`, "gold");
    }
  }
}

function openRoomModal() {
  updateRoomUI();
  renderRecentRooms();
  if (dom.inputRoomCode) {
    dom.inputRoomCode.value = "";
  }
  if (dom.modalCustomRoom) {
    dom.modalCustomRoom.style.display = "flex";
  }
  telegramEngine.haptic("light");
}

function closeRoomModal() {
  if (dom.modalCustomRoom) {
    dom.modalCustomRoom.style.display = "none";
  }
}

function renderRecentRooms() {
  if (!dom.recentRoomsSection || !dom.recentRoomsList) return;
  const recent = state.recentRooms || [];
  if (recent.length === 0) {
    dom.recentRoomsSection.style.display = "none";
    return;
  }
  dom.recentRoomsSection.style.display = "block";
  dom.recentRoomsList.innerHTML = "";

  recent.forEach(r => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "room-chip" + (r === state.currentRoomId ? " active" : "");
    chip.innerHTML = `<span>🔒</span> #${r}`;
    chip.addEventListener("click", () => {
      telegramEngine.haptic("selection");
      joinRoom(r);
    });
    dom.recentRoomsList.appendChild(chip);
  });
}

function shareRoomToTelegram() {
  telegramEngine.haptic("medium");
  const roomId = state.currentRoomId || "public";
  const botLink = `https://t.me/relicspin_bot?startapp=room_${roomId}`;
  const webLink = `${window.location.origin}/?room=${roomId}`;
  const shareTarget = (telegramEngine.tg ? botLink : webLink);

  const text = roomId === "public"
    ? "🔥 Đang có rất nhiều cao thủ cược trực tiếp tại Lucky Numbers 777! Vào phòng cược chung và săn Hũ Thần Tài cùng tôi nhé:"
    : `🔥 Mình vừa tạo phòng chơi riêng #${roomId} tại Lucky Numbers 777! Vào cùng phòng để cược chung, chat riêng và nhận mưa lì xì may mắn cùng mình nhé:`;

  shareToTelegram(text, shareTarget);
  showToast("✈️ Đang mở chia sẻ Telegram để mời bạn bè...", "info");
}

function copyRoomLink() {
  const roomId = state.currentRoomId || "public";
  const link = `${window.location.origin}/?room=${roomId}`;
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    navigator.clipboard.writeText(link).then(() => {
      soundEngine.playWinTone();
      telegramEngine.haptic("success");
      showToast("📋 Đã sao chép liên kết vào phòng! Hãy gửi cho bạn bè để cùng chơi.", "gold");
    }).catch(() => fallbackCopy(link));
  } else {
    fallbackCopy(link);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  soundEngine.playWinTone();
  telegramEngine.haptic("success");
  showToast("📋 Đã sao chép liên kết vào phòng!", "gold");
}

function initRoomSystem() {
  // Đọc deep link params từ Telegram WebApp hoặc URL query
  let detectedRoom = null;

  // 1. Telegram start_param (ví dụ: room_ROOM777 hoặc room_VIP888)
  const startParam = telegramEngine.tg?.initDataUnsafe?.start_param;
  if (startParam && typeof startParam === "string") {
    if (startParam.startsWith("room_")) {
      detectedRoom = startParam.replace(/^room_/, "").trim();
    }
  }

  // 2. URL search query: ?room=ROOM-777
  if (!detectedRoom && typeof window !== "undefined" && window.location?.search) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("room")) {
      detectedRoom = urlParams.get("room").trim();
    }
  }

  if (detectedRoom) {
    const cleaned = normalizeRoomIdClient(detectedRoom);
    if (cleaned && cleaned !== "public") {
      state.currentRoomId = cleaned;
      try {
        localStorage.setItem("lucky_current_room", cleaned);
      } catch (e) {}
      let recent = Array.isArray(state.recentRooms) ? [...state.recentRooms] : [];
      recent = recent.filter(r => r !== cleaned);
      recent.unshift(cleaned);
      state.recentRooms = recent.slice(0, 8);
      try {
        localStorage.setItem("lucky_recent_rooms", JSON.stringify(state.recentRooms));
      } catch (e) {}

      // Tự động chuyển sang chế độ Trực Tiếp của phòng riêng sau khi UI khởi tạo
      setTimeout(() => {
        joinRoom(cleaned, false);
      }, 400);
    }
  } else {
    // Khôi phục phòng gần nhất hoặc mặc định public
    const savedRoom = (typeof localStorage !== "undefined" && localStorage.getItem("lucky_current_room")) || "public";
    state.currentRoomId = normalizeRoomIdClient(savedRoom);
    updateRoomUI();
  }

  // Setup event listeners cho các nút điều khiển phòng
  if (dom.btnOpenRoomModal) dom.btnOpenRoomModal.addEventListener("click", openRoomModal);
  if (dom.btnDrawerSwitchRoom) dom.btnDrawerSwitchRoom.addEventListener("click", openRoomModal);
  if (dom.btnCloseRoomModal) dom.btnCloseRoomModal.addEventListener("click", closeRoomModal);
  if (dom.btnRoomShareTg) dom.btnRoomShareTg.addEventListener("click", shareRoomToTelegram);
  if (dom.btnRoomCopyLink) dom.btnRoomCopyLink.addEventListener("click", copyRoomLink);
  if (dom.btnLeavePrivateRoom) dom.btnLeavePrivateRoom.addEventListener("click", () => joinRoom("public"));

  if (dom.btnRandomRoomCode) {
    dom.btnRandomRoomCode.addEventListener("click", () => {
      telegramEngine.haptic("light");
      const prefixes = ["ROOM", "VIP", "LUCKY", "HOI", "CLB"];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const randNum = Math.floor(100 + Math.random() * 900);
      if (dom.inputRoomCode) dom.inputRoomCode.value = `${prefix}-${randNum}`;
    });
  }

  if (dom.btnJoinRoomSubmit) {
    dom.btnJoinRoomSubmit.addEventListener("click", () => {
      const code = dom.inputRoomCode ? dom.inputRoomCode.value.trim() : "";
      if (!code) {
        telegramEngine.haptic("error");
        showToast("Vui lòng nhập mã phòng hoặc bấm 'Mã Tự Động'!", "warn");
        if (dom.inputRoomCode) dom.inputRoomCode.focus();
        return;
      }
      joinRoom(code);
    });
  }

  if (dom.inputRoomCode) {
    dom.inputRoomCode.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (dom.btnJoinRoomSubmit) dom.btnJoinRoomSubmit.click();
      }
    });
  }

  if (dom.btnClearRecentRooms) {
    dom.btnClearRecentRooms.addEventListener("click", () => {
      state.recentRooms = [];
      try {
        localStorage.removeItem("lucky_recent_rooms");
      } catch (e) {}
      renderRecentRooms();
      telegramEngine.haptic("light");
      showToast("Đã xóa lịch sử phòng gần đây!", "info");
    });
  }

  // Tích hợp Telegram Bot Cho Group (Giai đoạn 3)
  if (dom.btnRoomAddBotToGroup) {
    dom.btnRoomAddBotToGroup.addEventListener("click", () => {
      telegramEngine.haptic("medium");
      const currentRoom = normalizeRoomIdClient(state.currentRoomId);
      const addBotUrl = `https://t.me/relicspin_bot?startgroup=room_${currentRoom}`;
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(addBotUrl);
      } else {
        window.open(addBotUrl, "_blank");
      }
      showToast("🚀 Đang mở Telegram để thêm Bot vào Nhóm!", "gold");
    });
  }

  if (dom.btnCopyLinkRoomCommand) {
    dom.btnCopyLinkRoomCommand.addEventListener("click", () => {
      telegramEngine.haptic("light");
      const currentRoom = normalizeRoomIdClient(state.currentRoomId);
      const cmdText = `/link_room ${currentRoom}`;
      fallbackCopy(cmdText);
      showToast(`📋 Đã sao chép: "${cmdText}". Hãy gửi vào nhóm Telegram!`, "gold");
    });
  }

  if (dom.btnTestBotBroadcast) {
    dom.btnTestBotBroadcast.addEventListener("click", async () => {
      telegramEngine.haptic("medium");
      const currentRoom = normalizeRoomIdClient(state.currentRoomId);
      try {
        dom.btnTestBotBroadcast.disabled = true;
        dom.btnTestBotBroadcast.textContent = "⏳ Đang bắn thử...";
        const res = await fetch("/api/telegram/test-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "jackpot",
            room_id: currentRoom,
            amount: 38800,
            user_name: getLiveUserName(),
            hand_title: "Ngũ Quý 7-7-7-7-7"
          })
        });
        const data = await res.json();
        if (data.status === "success") {
          telegramEngine.haptic("notification", "success");
          showToast(`🔔 ${data.message}`, "gold");
        } else {
          showToast(data.detail || "Không thể gửi tin nhắn thử!", "warn");
        }
      } catch (err) {
        showToast("Lỗi kiểm tra: " + err.message, "error");
      } finally {
        dom.btnTestBotBroadcast.disabled = false;
        dom.btnTestBotBroadcast.innerHTML = `<span>🔔</span> Bắn Thử Tin Mẫu`;
      }
    });
  }

  // Click backdrop để đóng modal phòng
  if (dom.modalCustomRoom) {
    dom.modalCustomRoom.addEventListener("click", (e) => {
      if (e.target === dom.modalCustomRoom) closeRoomModal();
    });
  }
}

function setupLiveRoomControls() {
  // Mode switcher: Solo vs Live
  if (dom.btnModeSolo) {
    dom.btnModeSolo.addEventListener("click", () => switchGameplayMode("solo"));
  }
  if (dom.btnModeLive) {
    dom.btnModeLive.addEventListener("click", () => switchGameplayMode("live"));
  }
  if (dom.btnModeLotto) {
    dom.btnModeLotto.addEventListener("click", () => switchGameplayMode("lotto"));
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
  if (dom.btnCloseShareWin) {
    dom.btnCloseShareWin.addEventListener("click", () => {
      if (dom.shareWinContainer) {
        dom.shareWinContainer.style.display = "none";
      }
    });
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

  // Profile & VIP Modal Events
  if (dom.playerVipPill) {
    dom.playerVipPill.addEventListener("click", openProfileModal);
  }
  if (dom.btnCloseProfileModal) {
    dom.btnCloseProfileModal.addEventListener("click", closeProfileModal);
  }
  if (dom.modalPlayerProfile) {
    dom.modalPlayerProfile.addEventListener("click", (e) => {
      if (e.target === dom.modalPlayerProfile) closeProfileModal();
    });
  }
  if (dom.btnSaveCustomUname) {
    dom.btnSaveCustomUname.addEventListener("click", handleSaveCustomName);
  }
  if (dom.inputCustomUname) {
    dom.inputCustomUname.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveCustomName();
      }
    });
  }

  // Leaderboard Modal Events
  if (dom.btnHeaderLeaderboard) {
    dom.btnHeaderLeaderboard.addEventListener("click", openLeaderboardModal);
  }
  if (dom.btnDrawerLeaderboard) {
    dom.btnDrawerLeaderboard.addEventListener("click", openLeaderboardModal);
  }
  if (dom.btnCloseLeaderboard) {
    dom.btnCloseLeaderboard.addEventListener("click", closeLeaderboardModal);
  }
  if (dom.modalLeaderboard) {
    dom.modalLeaderboard.addEventListener("click", (e) => {
      if (e.target === dom.modalLeaderboard) closeLeaderboardModal();
    });
  }
  if (dom.lbTabWinners) {
    dom.lbTabWinners.addEventListener("click", () => switchLeaderboardTab("winners"));
  }
  if (dom.lbTabDonors) {
    dom.lbTabDonors.addEventListener("click", () => switchLeaderboardTab("donors"));
  }
}

// ==========================================================================
// VIP SYSTEM, PLAYER PROFILE & TITLES
// ==========================================================================

const TITLES_CATALOG = [
  { id: "lucky", name: "🍀 Tân Thủ May Mắn", req: "Mặc định khi tham gia game" },
  { id: "donor", name: "🧧 Thần Tài Tặng Lộc", req: "Đã từng phát lì xì cho phòng" },
  { id: "rain_king", name: "🌧️ Chúa Tể Mưa Lộc", req: "Đã phát từ 1,000 Xu lì xì" },
  { id: "streak", name: "🎯 Bậc Thầy Soi Cầu", req: "Đạt chuỗi thắng từ 3 ván liên tiếp" },
  { id: "bigwin", name: "✨ Bàn Tay Vàng", req: "Thắng đơn ván từ 5,000 Xu trở lên" },
  { id: "jackpot", name: "💥 Kẻ Hủy Diệt Hũ", req: "Từng nổ hũ Sảnh/Ngũ Quý hoặc VIP 3+" },
  { id: "fortune_lock", name: "🔒 Phù Thủy Khóa Số", req: "Sử dụng tính năng Khóa Số Thần Tài" },
  { id: "vip_royal", name: "👑 Hoàng Gia 777", req: "Đạt cấp bậc VIP 4 hoặc VIP 5" }
];

function checkTitleUnlocked(titleId) {
  if (titleId === "lucky") return true;
  const uname = getLiveUserName().toLowerCase();
  const uid = getLiveUserId().toLowerCase();
  if (uname.includes("marothschild") || uid.includes("marothschild")) {
    return true; // @marothschild mở khóa toàn bộ danh hiệu
  }
  const s = state.session || {};
  const vipLvl = state.vipInfo?.level || 0;
  if (titleId === "donor") return (state.totalGivenRedPackets || 0) >= 100 || (s.total_wagered || 0) >= 2000;
  if (titleId === "rain_king") return (state.totalGivenRedPackets || 0) >= 1000 || vipLvl >= 3;
  if (titleId === "streak") return (state.currentStreak || 0) >= 3 || (state.maxStreak || 0) >= 3;
  if (titleId === "bigwin") return (s.total_won || 0) >= 5000 || vipLvl >= 2;
  if (titleId === "jackpot") return (s.total_won || 0) >= 20000 || vipLvl >= 3;
  if (titleId === "fortune_lock") return state.fortuneLockedNumbers && state.fortuneLockedNumbers.length > 0;
  if (titleId === "vip_royal") return vipLvl >= 4;
  return false;
}

function updateVipProfileUI(vipInfo) {
  if (!vipInfo) return;
  const name = getLiveUserName();
  const isRothschild = name.toLowerCase().includes("marothschild") || getLiveUserId().toLowerCase().includes("marothschild");

  if (isRothschild) {
    vipInfo = {
      level: 5,
      name: "VIP 5 - Thần Tài Hoàng Gia",
      icon: "👑",
      total_wagered: 888888,
      next_threshold: 500000,
      progress_pct: 100
    };
    if (!state.userProfile?.equippedTitle || state.userProfile?.equippedTitle === "🍀 Tân Thủ May Mắn") {
      state.userProfile.equippedTitle = "👑 Hoàng Gia 777";
    }
  }

  state.vipInfo = vipInfo;
  const equippedTitle = state.userProfile?.equippedTitle || (isRothschild ? "👑 Hoàng Gia 777" : "🍀 Tân Thủ May Mắn");

  if (dom.pvVipIcon) dom.pvVipIcon.textContent = vipInfo.icon || "🌱";
  if (dom.pvName) dom.pvName.textContent = name;
  if (dom.pvTitleBadge) dom.pvTitleBadge.textContent = equippedTitle;

  if (dom.profName) dom.profName.textContent = name;
  if (dom.profId) dom.profId.textContent = "ID: " + getLiveUserId();
  if (dom.profVipTag) dom.profVipTag.textContent = "VIP " + vipInfo.level;
  if (dom.profLevelName) dom.profLevelName.textContent = `${vipInfo.icon} ${vipInfo.name}`;
  if (dom.profExpFill) dom.profExpFill.style.width = `${vipInfo.progress_pct}%`;
  if (dom.profExpPct) dom.profExpPct.textContent = `${vipInfo.progress_pct}%`;
  if (dom.profExpTxt) {
    if (vipInfo.level >= 5) {
      dom.profExpTxt.textContent = `Đạt cấp VIP tối đa (Tổng cược: ${(vipInfo.total_wagered || 0).toLocaleString()} Xu)`;
    } else {
      dom.profExpTxt.textContent = `Đã cược: ${(vipInfo.total_wagered || 0).toLocaleString()} / ${vipInfo.next_threshold.toLocaleString()} Xu để lên VIP ${vipInfo.level + 1}`;
    }
  }
}

function setupProfileNameChange() {
  if (!dom.btnSaveCustomUname || !dom.inputCustomUname) return;
  const isChanged = localStorage.getItem("lucky_name_changed") === "true";
  const currentName = getLiveUserName();

  if (isChanged) {
    dom.inputCustomUname.value = currentName;
    dom.inputCustomUname.disabled = true;
    dom.btnSaveCustomUname.disabled = true;
    dom.btnSaveCustomUname.textContent = "ĐÃ ĐỔI TÊN";
    if (dom.pncStatusBadge) {
      dom.pncStatusBadge.textContent = "🔒 Đã đổi (Cố định)";
      dom.pncStatusBadge.classList.add("locked");
    }
    if (dom.pncHintTxt) {
      dom.pncHintTxt.textContent = "Bạn đã hoàn thành 1 lần đổi tên duy nhất của tài khoản.";
    }
  } else {
    dom.inputCustomUname.value = currentName;
    dom.inputCustomUname.disabled = false;
    dom.btnSaveCustomUname.disabled = false;
    dom.btnSaveCustomUname.textContent = "XÁC NHẬN";
    if (dom.pncStatusBadge) {
      dom.pncStatusBadge.textContent = "Chưa đổi (còn 1 lần)";
      dom.pncStatusBadge.classList.remove("locked");
    }
    if (dom.pncHintTxt) {
      dom.pncHintTxt.innerHTML = "⚠️ Lưu ý: Tên hiển thị trên kênh chat chỉ được đổi <strong>1 lần duy nhất</strong>.";
    }
  }
}

function handleSaveCustomName() {
  if (localStorage.getItem("lucky_name_changed") === "true") {
    showToast("⚠️ Bạn đã từng đổi tên rồi! Mỗi người chơi chỉ được đổi 1 lần.", "warn");
    return;
  }
  const newName = (dom.inputCustomUname ? dom.inputCustomUname.value : "").trim();
  if (!newName) {
    showToast("⚠️ Vui lòng nhập tên hiển thị mới!", "warn");
    return;
  }
  if (newName.length < 3 || newName.length > 16) {
    showToast("⚠️ Tên hiển thị phải từ 3 đến 16 ký tự!", "warn");
    return;
  }
  const cleanName = newName.replace(/[\<\>\"\'\`]/g, "");

  localStorage.setItem("lucky_custom_uname", cleanName);
  localStorage.setItem("lucky_name_changed", "true");

  telegramEngine.haptic("success");
  soundEngine.playWinTone();
  showToast(`🎉 Đã đổi tên hiển thị thành: <strong>${cleanName}</strong>!`, "gold");

  setupProfileNameChange();
  if (state.vipInfo) updateVipProfileUI(state.vipInfo);
  renderProfileTitlesGrid();
  syncLiveRoomState();
}

function openProfileModal() {
  if (!dom.modalPlayerProfile) return;
  telegramEngine.haptic("medium");
  setupProfileNameChange();
  if (state.vipInfo) updateVipProfileUI(state.vipInfo);
  renderProfileTitlesGrid();
  dom.modalPlayerProfile.style.display = "flex";
}

function closeProfileModal() {
  if (!dom.modalPlayerProfile) return;
  dom.modalPlayerProfile.style.display = "none";
}

function renderProfileTitlesGrid() {
  if (!dom.profileTitlesGrid) return;
  const equipped = state.userProfile?.equippedTitle || "🍀 Tân Thủ May Mắn";

  dom.profileTitlesGrid.innerHTML = TITLES_CATALOG.map(t => {
    const isUnlocked = checkTitleUnlocked(t.id);
    const isEq = equipped === t.name;
    return `
      <div class="title-card-item ${isEq ? "equipped" : ""} ${!isUnlocked ? "locked" : ""}" data-title-name="${t.name}" data-unlocked="${isUnlocked}">
        <div class="tci-info">
          <span class="tci-name">${t.name}</span>
          <span class="tci-req">${isUnlocked ? "✅ Đã mở khóa" : ("🔒 " + t.req)}</span>
        </div>
        <button class="tci-btn">${isEq ? "ĐANG ĐEO" : (isUnlocked ? "TRANG BỊ" : "CHƯA MỞ")}</button>
      </div>
    `;
  }).join("");

  dom.profileTitlesGrid.querySelectorAll(".title-card-item").forEach(item => {
    item.addEventListener("click", () => {
      const isUn = item.dataset.unlocked === "true";
      const tName = item.dataset.titleName;
      if (!isUn) {
        showToast("🔒 Danh hiệu này chưa mở khóa! Hãy cược thêm để đạt yêu cầu.", "warn");
        return;
      }
      equipTitleAction(tName);
    });
  });
}

function equipTitleAction(titleName) {
  if (!titleName) return;
  state.userProfile.equippedTitle = titleName;
  try {
    localStorage.setItem("lucky_user_title", titleName);
  } catch (e) {}
  telegramEngine.haptic("success");
  soundEngine.playWinTone();
  showToast(`👑 Đã trang bị danh hiệu: <strong>${titleName}</strong>!`, "gold");
  if (dom.pvTitleBadge) dom.pvTitleBadge.textContent = titleName;
  renderProfileTitlesGrid();
}

// ==========================================================================
// LIVE ROADMAP (BẢNG SOI CẦU PHIÊN LIVE)
// ==========================================================================

function renderRoadmap(roadmapList) {
  if (!dom.roadmapBeadsTrack || !Array.isArray(roadmapList) || roadmapList.length === 0) return;

  let taiCount = 0;
  let xiuCount = 0;
  let hoaCount = 0;

  roadmapList.forEach(r => {
    if (r.side === "TAI") taiCount++;
    else if (r.side === "XIU") xiuCount++;
    else hoaCount++;
  });

  const total = roadmapList.length || 1;
  const pctTai = Math.round((taiCount / total) * 100);
  const pctXiu = Math.round((xiuCount / total) * 100);

  if (dom.rmPctTai) dom.rmPctTai.textContent = `${pctTai}% (${taiCount})`;
  if (dom.rmPctXiu) dom.rmPctXiu.textContent = `${pctXiu}% (${xiuCount})`;

  // Tính chuỗi bệt ở đuôi mảng (phiên gần nhất)
  if (dom.rmStreakTag && roadmapList.length > 0) {
    const last = roadmapList[roadmapList.length - 1];
    let streakCount = 0;
    for (let i = roadmapList.length - 1; i >= 0; i--) {
      if (roadmapList[i].side === last.side) streakCount++;
      else break;
    }
    if (streakCount >= 3) {
      dom.rmStreakTag.textContent = `🔥 Bệt ${last.side === "TAI" ? "Tài" : "Xỉu"} ${streakCount} cây!`;
    } else {
      dom.rmStreakTag.textContent = `⚡ Cầu chuyển tiếp`;
    }
  }

  dom.roadmapBeadsTrack.innerHTML = roadmapList.map(item => {
    const isTai = item.side === "TAI";
    const isHoa = item.side === "HOA";
    const cls = isTai ? "tai" : (isHoa ? "hoa" : "xiu");
    const label = isTai ? "T" : (isHoa ? "H" : "X");
    return `
      <div class="rm-bead ${cls}" title="${item.round_id}: Tổng ${item.sum} (${isTai ? "Tài" : (isHoa ? "Hòa" : "Xỉu")}) • ${item.hand_title}">
        <span>${label}</span>
        <span class="rm-bead-sum">${item.sum}</span>
      </div>
    `;
  }).join("");

  dom.roadmapBeadsTrack.scrollLeft = dom.roadmapBeadsTrack.scrollWidth;
}

// ==========================================================================
// LEADERBOARD (BẢNG XẾP HẠNG CAO THỦ)
// ==========================================================================

async function openLeaderboardModal() {
  if (!dom.modalLeaderboard) return;
  telegramEngine.haptic("medium");
  dom.modalLeaderboard.style.display = "flex";
  await fetchAndRenderLeaderboard(state.currentLbTab || "winners");
}

function closeLeaderboardModal() {
  if (!dom.modalLeaderboard) return;
  dom.modalLeaderboard.style.display = "none";
}

function switchLeaderboardTab(tab) {
  state.currentLbTab = tab;
  if (dom.lbTabWinners) dom.lbTabWinners.classList.toggle("active", tab === "winners");
  if (dom.lbTabDonors) dom.lbTabDonors.classList.toggle("active", tab === "donors");
  renderLeaderboardList();
}

async function fetchAndRenderLeaderboard(tab = "winners") {
  if (!dom.lbBodyContainer) return;
  dom.lbBodyContainer.innerHTML = `<div style="text-align:center; padding: 25px; color:#94a3b8; font-size:0.85rem;">⏳ Đang tải bảng vàng cao thủ...</div>`;
  try {
    const res = await fetch("/api/live/leaderboard");
    const json = await res.json();
    if (json.status === "success" && json.data) {
      state.leaderboardData = json.data;
      renderLeaderboardList();
    }
  } catch (e) {
    dom.lbBodyContainer.innerHTML = `<div style="text-align:center; padding: 25px; color:#f87171;">Không thể tải bảng xếp hạng lúc này.</div>`;
  }
}

function renderLeaderboardList() {
  if (!dom.lbBodyContainer || !state.leaderboardData) return;
  const tab = state.currentLbTab || "winners";
  const list = tab === "winners" ? (state.leaderboardData.top_winners || []) : (state.leaderboardData.top_donors || []);

  if (list.length === 0) {
    dom.lbBodyContainer.innerHTML = `<div style="text-align:center; padding: 25px; color:#94a3b8;">Chưa có dữ liệu xếp hạng hôm nay.</div>`;
    return;
  }

  dom.lbBodyContainer.innerHTML = list.map((item, idx) => {
    const rank = idx + 1;
    const rankCls = rank <= 3 ? `rank-${rank}` : "";
    const vipLvl = item.vip_level || (rank === 1 ? 5 : (rank <= 3 ? 4 : 3));
    const vipIcons = ["🌱", "🥉", "🥈", "🥇", "💎", "👑"];
    const vipTag = `<span class="chat-vip-badge vip-${vipLvl}">${vipIcons[vipLvl]} VIP ${vipLvl}</span>`;

    if (tab === "winners") {
      return `
        <div class="lb-item-row ${rankCls}">
          <div class="lb-rank-badge">${rank <= 3 ? (rank === 1 ? "🥇" : (rank === 2 ? "🥈" : "🥉")) : rank}</div>
          <div class="lb-user-info">
            <span class="lb-avatar">${item.avatar || "👤"}</span>
            <div class="lb-user-text">
              <span class="lb-username">${vipTag} ${item.username}</span>
              <span class="lb-sub">${item.hand || "Chiến tích lớn"}</span>
            </div>
          </div>
          <div class="lb-val-col">
            <span class="lb-val">+${(item.amount || 0).toLocaleString()} Xu</span>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="lb-item-row ${rankCls}">
          <div class="lb-rank-badge">${rank <= 3 ? (rank === 1 ? "🥇" : (rank === 2 ? "🥈" : "🥉")) : rank}</div>
          <div class="lb-user-info">
            <span class="lb-avatar">${item.avatar || "🧧"}</span>
            <div class="lb-user-text">
              <span class="lb-username">${vipTag} ${item.username}</span>
              <span class="lb-sub">${item.title || "Thần Tài Tặng Lộc"} • ${item.count || 1} đợt phát</span>
            </div>
          </div>
          <div class="lb-val-col">
            <span class="lb-val" style="color: #ff6b6b;">-${(item.total_given || 0).toLocaleString()} Xu</span>
          </div>
        </div>
      `;
    }
  }).join("");
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
  const isLotto = mode === "lotto";
  const isSolo = mode === "solo";

  if (dom.btnModeSolo) dom.btnModeSolo.classList.toggle("active", isSolo);
  if (dom.btnModeLive) dom.btnModeLive.classList.toggle("active", isLive);
  if (dom.btnModeLotto) dom.btnModeLotto.classList.toggle("active", isLotto);

  const gameLayout = document.querySelector(".game-layout");
  if (gameLayout) gameLayout.style.display = "";

  const liveSoikeoPanel = document.querySelector(".game-live-soikeo-panel");

  if (isLotto) {
    if (dom.slotBettingBoard) dom.slotBettingBoard.style.display = "none";
    if (dom.lottoBettingBoard) dom.lottoBettingBoard.style.display = "";
    if (liveSoikeoPanel) liveSoikeoPanel.style.display = "none";
    if (dom.lottoRoadmapCard) dom.lottoRoadmapCard.style.display = "";
    if (dom.liveRoundBanner) dom.liveRoundBanner.style.display = "none";
    if (dom.liveRoomOnlinePill) dom.liveRoomOnlinePill.style.display = "none";

    const spinMain = dom.btnSpin ? dom.btnSpin.querySelector(".spin-main") : null;
    const spinSub = dom.btnSpin ? dom.btnSpin.querySelector(".spin-sub") : null;
    if (spinMain) spinMain.textContent = "ĐẶT VÉ";
    if (spinSub) spinSub.textContent = "TICKET";

    showToast("🎯 Đã chuyển sang chế độ <strong>XỔ SỐ SIÊU TỐC 5D</strong> (Dự đoán dãy số hàng giữa)", "gold");
    stopLivePolling();
    syncLottoState();
    startLottoPolling();
  } else if (isLive) {
    if (dom.slotBettingBoard) dom.slotBettingBoard.style.display = "";
    if (dom.lottoBettingBoard) dom.lottoBettingBoard.style.display = "none";
    if (liveSoikeoPanel) liveSoikeoPanel.style.display = "";
    if (dom.lottoRoadmapCard) dom.lottoRoadmapCard.style.display = "none";
    if (dom.liveRoundBanner) dom.liveRoundBanner.style.display = "block";
    if (dom.liveRoomOnlinePill) dom.liveRoomOnlinePill.style.display = "flex";

    const spinMain = dom.btnSpin ? dom.btnSpin.querySelector(".spin-main") : null;
    const spinSub = dom.btnSpin ? dom.btnSpin.querySelector(".spin-sub") : null;
    if (spinMain) spinMain.textContent = "CƯỢC";
    if (spinSub) spinSub.textContent = "CONFIRM BET";

    showToast("👥 Đã vào <strong>PHÒNG TRỰC TIẾP</strong> (Phiên đồng bộ toàn server)", "gold");
    stopLottoPolling();
    syncLiveRoomState();
    startLivePolling();
  } else {
    if (dom.slotBettingBoard) dom.slotBettingBoard.style.display = "";
    if (dom.lottoBettingBoard) dom.lottoBettingBoard.style.display = "none";
    if (liveSoikeoPanel) liveSoikeoPanel.style.display = "none";
    if (dom.lottoRoadmapCard) dom.lottoRoadmapCard.style.display = "none";
    if (dom.liveRoundBanner) dom.liveRoundBanner.style.display = "none";
    if (dom.liveRoomOnlinePill) dom.liveRoomOnlinePill.style.display = "none";

    const spinMain = dom.btnSpin ? dom.btnSpin.querySelector(".spin-main") : null;
    const spinSub = dom.btnSpin ? dom.btnSpin.querySelector(".spin-sub") : null;
    if (spinMain) spinMain.textContent = "QUAY";
    if (spinSub) spinSub.textContent = "SPIN";

    showToast("👤 Đã chuyển về <strong>CHƠI ĐƠN</strong> (Tự quay tự do)", "cyan");
    renderCommunityDoorBets({});
    stopLivePolling();
    stopLottoPolling();
  }
}

function openChatDrawer() {
  if (!dom.chatDrawerBackdrop) return;
  dom.chatDrawerBackdrop.classList.add("open");
  document.body.classList.add("chat-drawer-open");
  
  // Gỡ bỏ ngay lập tức thanh menu dock dưới đáy màn hình để không chèn vào ô nhập chat
  const mainNavTabs = document.getElementById("mainNavTabs");
  if (mainNavTabs) {
    mainNavTabs.classList.remove("is-docked-bottom");
  }
  const appContainer = document.querySelector(".app-container");
  if (appContainer) {
    appContainer.classList.remove("has-docked-nav");
  }
  document.body.classList.remove("has-docked-nav");

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
  if (typeof window.recheckScrollNav === "function") {
    window.recheckScrollNav();
  }
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
    const roomId = state.currentRoomId || "public";
    const res = await fetch(`/api/live/state?user_id=${getLiveUserId()}&username=${encodeURIComponent(getLiveUserName())}&room_id=${encodeURIComponent(roomId)}`);
    const json = await res.json();
    if (json.status === "success" && json.data) {
      if (json.data.online_count) {
        if (dom.liveOnlineCount) dom.liveOnlineCount.textContent = json.data.online_count;
        if (dom.drawerOnlineCount) dom.drawerOnlineCount.textContent = json.data.online_count;
        if (dom.chatFloatingBadge) dom.chatFloatingBadge.textContent = `${json.data.online_count}`;
        if (dom.crcOnlineCount) dom.crcOnlineCount.textContent = `${json.data.online_count}`;
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

  syncLiveRoomState();
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
  syncLiveRoomState();
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
    const roomId = state.currentRoomId || "public";
    const res = await fetch(`/api/live/state?user_id=${uid}&username=${encodeURIComponent(uname)}&room_id=${encodeURIComponent(roomId)}`);
    const json = await res.json();
    if (json.status !== "success" || !json.data) return;

    const data = json.data;
    state.liveRoundData = data.round;
    state.liveLocalTimeLeft = data.round.time_left_sec;

    // Cập nhật room info từ server
    if (data.room_info) {
      state.currentRoomInfo = data.room_info;
      updateRoomUI();
    }

    // Update online count
    if (dom.liveOnlineCount) dom.liveOnlineCount.textContent = data.online_count;
    if (dom.drawerOnlineCount) dom.drawerOnlineCount.textContent = data.online_count;
    if (dom.chatFloatingBadge) dom.chatFloatingBadge.textContent = `${data.online_count}`;
    if (dom.crcOnlineCount) dom.crcOnlineCount.textContent = `${data.online_count}`;

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

    // Kích hoạt mưa lì xì nếu phòng có người phát lộc mới (chỉ hiện cho người khác, không hiện cho người phát)
    if (data.active_red_packets && data.active_red_packets.length > 0) {
      for (const rp of data.active_red_packets) {
        if (!state.activeRedPacketIdsSpawned.has(rp.id)) {
          state.activeRedPacketIdsSpawned.add(rp.id);
          if (rp.sender_id !== getLiveUserId()) {
            triggerRedPacketRain(rp);
          }
        }
      }
    }

    // Tự động thông báo và hoàn tiền lì xì chưa có người nhận cho người phát
    if (data.user_last_redpacket_refund) {
      const ref = data.user_last_redpacket_refund;
      if (!state.lastRefundPacketId || state.lastRefundPacketId !== ref.packet_id) {
        state.lastRefundPacketId = ref.packet_id;
        soundEngine.playWinTone();
        telegramEngine.haptic("success");
        showToast(`🧧 <strong>HOÀN TIỀN LÌ XÌ:</strong> Đã hoàn lại <strong>+${ref.amount.toLocaleString()} Xu</strong> (chưa có người nhận) vào tài khoản của bạn!`, "cyan");
        if (state.session) {
          state.session.balance = data.user_balance;
        }
        updateMeters();
      }
    }

    // Đồng bộ và hiển thị tin nhắn phòng chat
    if (data.recent_messages && Array.isArray(data.recent_messages)) {
      renderChatMessages(data.recent_messages);
    }

    // Đồng bộ và kích hoạt hiệu ứng thả cảm xúc từ mọi người chơi trong phòng
    if (data.recent_reactions && Array.isArray(data.recent_reactions)) {
      const now = Date.now();
      data.recent_reactions.forEach(rx => {
        if (!state.seenReactionIds.has(rx.id)) {
          state.seenReactionIds.add(rx.id);
          // Chỉ spawn nếu cảm xúc mới xuất hiện trong vòng 4.5s gần nhất để tránh spam dồn ứ
          if ((now - (rx.time || 0)) < 4500) {
            spawnFloatingEmoji(rx.emoji);
          }
        }
      });
    }

    // Đồng bộ Bảng Soi Cầu phiên Live
    if (data.roadmap && Array.isArray(data.roadmap)) {
      renderRoadmap(data.roadmap);
    }

    // Đồng bộ Cấp Bậc VIP & Hồ Sơ Cá Nhân
    if (data.vip_info) {
      updateVipProfileUI(data.vip_info);
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
  if (dom.shareWinContainer) dom.shareWinContainer.style.display = "none";
  if (dom.winBanner) {
    dom.winBanner.classList.remove("show");
    dom.winBanner.style.display = "none";
  }

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
        room_id: state.currentRoomId || "public",
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
    telegramEngine.haptic("medium");
    soundEngine.init();
    soundEngine.playChip();

    // Optimistic UI: hiển thị ngay tin nhắn của người dùng trong khung chat không cần chờ mạng
    const curName = getLiveUserName();
    const isRothschild = curName.toLowerCase().includes("marothschild") || getLiveUserId().toLowerCase().includes("marothschild");
    const currentVipLvl = isRothschild ? 5 : (state.vipInfo?.level || 0);
    const currentTitle = isRothschild ? (state.userProfile?.equippedTitle || "👑 Hoàng Gia 777") : (state.userProfile?.equippedTitle || "🍀 Tân Thủ May Mắn");
    const roomId = state.currentRoomId || "public";

    const tempMsg = {
      id: "local-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      user_id: getLiveUserId(),
      username: curName,
      room_id: roomId,
      avatar: isRothschild ? "👑" : (telegramEngine.tg?.initDataUnsafe?.user?.photo_url ? "⭐️" : "👤"),
      vip_level: currentVipLvl,
      title: currentTitle,
      text: text,
      type: "chat",
      time: Date.now()
    };
    if (state.chatMessagesCache) {
      state.chatMessagesCache.push(tempMsg);
      renderChatMessages(state.chatMessagesCache);
    }

    const res = await fetch("/api/live/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: getLiveUserId(),
        username: curName,
        room_id: roomId,
        avatar: isRothschild ? "👑" : (telegramEngine.tg?.initDataUnsafe?.user?.photo_url ? "⭐️" : "👤"),
        vip_level: currentVipLvl,
        title: currentTitle,
        text: text
      })
    });
    const json = await res.json();
    if (json.status === "success") {
      syncLiveRoomState();
    }
  } catch (e) {
    console.error("Send chat error:", e);
  }
}

async function sendReaction(emoji, originX) {
  try {
    spawnFloatingEmoji(emoji, originX);
    soundEngine.init();
    soundEngine.playChip();
    telegramEngine.haptic("light");
    const res = await fetch("/api/live/reaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emoji,
        room_id: state.currentRoomId || "public"
      })
    });
    const json = await res.json();
    if (json.status === "success" && json.data) {
      state.seenReactionIds.add(json.data.id);
    }
  } catch (e) {
    console.error("Send reaction error:", e);
  }
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
      room_id: state.currentRoomId || "public",
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

let lastRenderedChatMsgId = "";
let lastRenderedChatCount = 0;

function renderChatMessages(messages) {
  if (!dom.chatMessagesContainer || !messages) return;
  state.chatMessagesCache = messages;
  // Sắp xếp tin nhắn: tin cũ ở trên, tin mới nhất ở dưới đáy
  const sorted = [...messages].sort((a, b) => (Number(a.time) || 0) - (Number(b.time) || 0));
  const latestId = sorted.length > 0 ? sorted[sorted.length - 1].id : "";
  if (sorted.length === lastRenderedChatCount && latestId === lastRenderedChatMsgId) {
    return;
  }
  lastRenderedChatCount = sorted.length;
  lastRenderedChatMsgId = latestId;

  dom.chatMessagesContainer.innerHTML = sorted.map(msg => {
    const isSys = msg.type === "system";
    const isWinShare = msg.type === "win_share" || !!msg.slip;
    const isRedPacket = msg.type === "red_packet" || !!msg.packet_id;
    const isClaimNotice = msg.type === "red_packet_claim" || !!msg.claim_info;
    const timeNum = Number(msg.time) || 0;
    const timeStr = timeNum > 1000000000 ? new Date(timeNum).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Vừa xong";
    let slipHtml = "";
    if (msg.slip) {
      slipHtml = `
        <div class="chat-win-slip">
          <span class="cws-title">🏆 THẺ CHIẾN TÍCH: ${msg.slip.hand || "THẮNG LỚN"}</span>
          <span class="cws-amt">+${(msg.slip.amount || 0).toLocaleString()} Xu</span>
        </div>
      `;
    }
    let claimHtml = "";
    if (isClaimNotice && msg.claim_info) {
      claimHtml = `
        <div class="chat-claim-pill">
          <span class="ccp-tag">🧧 NHẬN LỘC MAY MẮN</span>
          <span class="ccp-detail"><strong>+${(msg.claim_info.amount || 0).toLocaleString()} Xu</strong> từ <strong>${msg.claim_info.sender_name || "Bạn bè"}</strong></span>
        </div>
      `;
    }
    let rpBtnHtml = "";
    if (isRedPacket && msg.packet_id) {
      if (msg.sender_id === getLiveUserId()) {
        rpBtnHtml = `
          <div style="margin-top: 5px;">
            <span style="font-size: 0.72rem; color: #ffd700; font-weight: 800; background: rgba(255, 215, 0, 0.15); border: 1px solid rgba(255, 215, 0, 0.35); padding: 3px 9px; border-radius: 6px;">
              🧧 Gói phát lộc của bạn
            </span>
          </div>
        `;
      } else {
        rpBtnHtml = `
          <div>
            <button class="chat-claim-packet-btn" data-packet-id="${msg.packet_id}">
              🧧 BẤM NHẬN LỘC NGAY
            </button>
          </div>
        `;
      }
    }
    const isRothschildSender = (msg.username && (msg.username.toLowerCase().includes("marothschild") || msg.username.toLowerCase() === "@marothschild")) ||
                               (msg.user_id && msg.user_id.toLowerCase().includes("marothschild"));
    const vipLvl = isRothschildSender ? 5 : (Number(msg.vip_level) || 0);
    const vipIcons = ["🌱", "🥉", "🥈", "🥇", "💎", "👑"];
    const vipBadgeHtml = !isSys ? `<span class="chat-vip-badge vip-${vipLvl}">${vipIcons[vipLvl] || "🌱"} VIP ${vipLvl}</span>` : "";
    const activeTitle = isRothschildSender ? (msg.title || "👑 Hoàng Gia 777") : msg.title;
    const titleBadgeHtml = (activeTitle && !isSys) ? `<span class="chat-title-badge-tag">${activeTitle}</span>` : "";
    const isVip5 = vipLvl >= 5 || isRothschildSender;

    return `
      <div class="chat-msg-row ${isSys ? "system" : ""} ${isWinShare ? "win-share" : ""} ${isRedPacket ? "red-packet-msg" : ""} ${isClaimNotice ? "claim-notice-msg" : ""} ${isVip5 ? "vip-5-msg" : ""}">
        <span class="chat-msg-avatar">${isRothschildSender ? "👑" : (msg.avatar || (isClaimNotice ? "🎁" : "👤"))}</span>
        <div class="chat-msg-content">
          <div class="chat-msg-header">
            <div class="chat-msg-header-top">
              ${vipBadgeHtml}
              <span class="chat-msg-author">${msg.username || "Thành viên"}</span>
              ${timeStr ? `<span class="chat-msg-time">${timeStr}</span>` : ""}
            </div>
            ${titleBadgeHtml ? `<div class="chat-msg-title-row">${titleBadgeHtml}</div>` : ""}
          </div>
          <span class="chat-msg-text">${msg.text || ""}</span>
          ${slipHtml}
          ${claimHtml}
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
  if (!dom.redPacketRainLayer || !packet) return;
  // Người phát lộc không nhìn thấy mưa lì xì hoặc nút nhận của chính mình
  if (packet.sender_id === getLiveUserId()) return;

  soundEngine.init();
  soundEngine.playWinTone();
  telegramEngine.haptic("warning");
  showToast(`🧧 <strong>${packet.sender_name}</strong> vừa PHÁT LỘC <strong>${(packet.total_amount || 200).toLocaleString()} Xu</strong>! Mau nhặt bao lì xì!`, "gold");

  // Kích hoạt lớp phủ chống chạm nhầm xuống bàn cược
  dom.redPacketRainLayer.innerHTML = "";
  dom.redPacketRainLayer.classList.add("active");

  // Header chữ phát sáng nghệ thuật trên đỉnh
  const headerEl = document.createElement("div");
  headerEl.className = "rp-rain-header glowing-header";
  headerEl.innerHTML = `
    <div class="rp-sparkle-tags">✨ 🧧 ✨</div>
    <div class="rp-rain-glowing-title">MƯA LÌ XÌ PHÁT LỘC!</div>
    <div class="rp-rain-sub-pill">
      <span>Lộc từ <strong class="rp-sender-name">${packet.sender_name}</strong></span>
      <span class="rp-sep">•</span>
      <span>Chạm bao lì xì rơi hoặc bấm nút dưới</span>
    </div>
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
    if (e.target.closest(".red-packet-body") || e.target.closest(".rp-quick-claim-wrap") || e.target.closest(".rp-rain-header")) {
      return;
    }
    const unclaimed = dom.redPacketRainLayer.querySelectorAll(".red-packet-body:not([data-claimed])");
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
    // 1. Khung rơi quỹ đạo GPU độc lập (giữ nguyên translateY tuyến tính không giật lag)
    const track = document.createElement("div");
    track.className = "falling-track";

    // 2. Ruột bao lì xì lắc lư và phóng to mượt mà khi bấm trúng
    const bodyEl = document.createElement("div");
    bodyEl.className = "red-packet-body";
    bodyEl.innerHTML = `
      <span class="rp-icon">🧧</span>
      <span class="rp-text">LỘC</span>
    `;

    const startX = 6 + Math.random() * 88;
    const delay = Math.random() * 1.6;
    const duration = 3.8 + Math.random() * 1.6;

    track.style.left = `${startX}%`;
    track.style.animationDelay = `${delay}s`;
    track.style.animationDuration = `${duration}s`;

    const handleClaim = (e) => {
      e.preventDefault();
      e.stopPropagation();
      claimRedPacketAction(packet.id, bodyEl);
    };

    bodyEl.addEventListener("pointerdown", handleClaim, { passive: false });
    bodyEl.addEventListener("touchstart", handleClaim, { passive: false });

    track.appendChild(bodyEl);
    dom.redPacketRainLayer.appendChild(track);
  }

  // Tự động đóng lớp mưa lì xì sau 7 giây
  if (redPacketRainTimeout) clearTimeout(redPacketRainTimeout);
  redPacketRainTimeout = setTimeout(() => {
    dismissRedPacketRain();
  }, 7000);
}

async function claimRedPacketAction(packetId, el) {
  if (!packetId) return;
  if (el && el.dataset && el.dataset.claimed) return;
  if (el && el.dataset) el.dataset.claimed = "true";

  // Hiệu ứng mượt mà tại chỗ trên .red-packet-body (không làm mất tọa độ rơi của .falling-track)
  if (el) {
    let targetBody = null;
    if (el.classList && el.classList.contains("red-packet-body")) {
      targetBody = el;
    } else if (el.querySelector && el.querySelector(".red-packet-body")) {
      targetBody = el.querySelector(".red-packet-body");
    } else if (el.closest && el.closest(".falling-track")) {
      targetBody = el.closest(".falling-track").querySelector(".red-packet-body");
    }

    if (targetBody) {
      targetBody.dataset.claimed = "true";
      targetBody.classList.add("claimed");
    } else if (el.classList) {
      el.classList.add("claimed");
    }
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
      showToast(`🧧 <strong>CHÚC MỪNG!</strong> Bạn vừa nhận được <strong>+${(json.data.amount || 0).toLocaleString()} Xu</strong> lộc từ <strong>${json.data.sender_name}</strong>!`, "gold");
      spawnFloatingEmoji("💰");
      setTimeout(() => spawnFloatingEmoji("🎉"), 200);
      syncLiveRoomState();
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
        room_id: state.currentRoomId || "public",
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
      // Người phát lộc không nhìn thấy mưa lì xì hoặc nút nhận của chính mình
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

// ==========================================
// HỆ THỐNG XỔ SỐ SIÊU TỐC 5D (LOTTO 5D SYSTEM)
// ==========================================

function initLottoSystem() {
  if (!dom.lottoBettingBoard) return;

  // 1. Channel buttons
  const chBtns = document.querySelectorAll(".lotto-ch-btn");
  chBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("selection");
      const ch = btn.dataset.channel;
      if (!ch) return;
      lottoState.currentChannel = ch;
      chBtns.forEach(b => b.classList.toggle("active", b.dataset.channel === ch));
      if (dom.lottoChannelBadge) {
        const badgeMap = { "30s": "⚡ 30s", "60s": "⏱️ 60s", "3m": "☕ 3m", "60m": "👑 60m" };
        dom.lottoChannelBadge.textContent = badgeMap[ch] || ch;
      }
      if (dom.lrcChannelNote) {
        const noteMap = { "30s": "Siêu Tốc 30s", "60s": "Tiêu Chuẩn 60s", "3m": "Keno 3 Phút", "60m": "Mega 1 Giờ" };
        dom.lrcChannelNote.textContent = `Kênh: ${noteMap[ch] || ch}`;
      }
      syncLottoState();
    });
  });

  // Start continuous 1s ticker for channel countdowns
  setInterval(tickLottoChannelsTimers, 1000);
  tickLottoChannelsTimers();

  // 2. Subtabs (Cược Số vs Cược Nhanh)
  if (dom.btnSubtabSo && dom.btnSubtabNhanh) {
    dom.btnSubtabSo.addEventListener("click", () => switchLottoSubtab("so"));
    dom.btnSubtabNhanh.addEventListener("click", () => switchLottoSubtab("nhanh"));
  }

  // 3. Bet Type Radio (DE_DUOI, DE_DAU, BA_CANG)
  const radios = document.querySelectorAll('input[name="lottoBetType"]');
  radios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("selection");
      lottoState.selectedBetType = e.target.value;
      
      // Update radio wrappers
      document.querySelectorAll(".lbt-radio").forEach(lbl => {
        const inp = lbl.querySelector("input");
        lbl.classList.toggle("active", inp && inp.checked);
      });

      // Show/hide Hàng Trăm for BA_CANG
      if (dom.lmsRowTram) {
        dom.lmsRowTram.style.display = (lottoState.selectedBetType === "BA_CANG") ? "flex" : "none";
      }

      // Reset matrix temporary picks & clear numbers
      resetLottoMatrixDigits();
      lottoState.selectedNumbers.clear();
      renderLottoTray();
      updateLottoTotalWager();
    });
  });

  // 4. Render 10 Digit Buttons (0-9) for Trăm, Chục, Đơn Vị
  renderLottoMatrixDigits();

  // 5. Custom Number Input
  if (dom.btnAddCustomNumbers && dom.inputLottoCustomNumbers) {
    dom.btnAddCustomNumbers.addEventListener("click", addCustomLottoNumbers);
    dom.inputLottoCustomNumbers.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addCustomLottoNumbers();
      }
    });
  }

  // 6. Shortcuts
  if (dom.btnLottoRandNumber) {
    dom.btnLottoRandNumber.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("selection");
      const is3D = lottoState.selectedBetType === "BA_CANG";
      const randNum = is3D
        ? String(Math.floor(Math.random() * 1000)).padStart(3, "0")
        : String(Math.floor(Math.random() * 100)).padStart(2, "0");
      lottoState.selectedNumbers.add(randNum);
      renderLottoTray();
      updateLottoTotalWager();
    });
  }

  if (dom.btnLottoKepBang) {
    dom.btnLottoKepBang.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("selection");
      if (lottoState.selectedBetType === "BA_CANG") {
        showToast("⚠️ Kép bằng chỉ áp dụng cho cược Đề 2D (Đề Đuôi / Đề Đầu)!", "warn");
        return;
      }
      ["00", "11", "22", "33", "44", "55", "66", "77", "88", "99"].forEach(n => lottoState.selectedNumbers.add(n));
      showToast("🎯 Đã chọn dàn 10 số Kép Bằng (00..99)!", "gold");
      renderLottoTray();
      updateLottoTotalWager();
    });
  }

  if (dom.btnLottoDauChan) {
    dom.btnLottoDauChan.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("selection");
      if (lottoState.selectedBetType === "BA_CANG") {
        showToast("⚠️ Dàn Đầu Chẵn chỉ áp dụng cho cược Đề 2D!", "warn");
        return;
      }
      for (const d of [0, 2, 4, 6, 8]) {
        for (let u = 0; u <= 9; u++) {
          lottoState.selectedNumbers.add(`${d}${u}`);
        }
      }
      showToast("🎯 Đã chọn dàn 50 số Đầu Chẵn!", "gold");
      renderLottoTray();
      updateLottoTotalWager();
    });
  }

  if (dom.btnLottoDauLe) {
    dom.btnLottoDauLe.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("selection");
      if (lottoState.selectedBetType === "BA_CANG") {
        showToast("⚠️ Dàn Đầu Lẻ chỉ áp dụng cho cược Đề 2D!", "warn");
        return;
      }
      for (const d of [1, 3, 5, 7, 9]) {
        for (let u = 0; u <= 9; u++) {
          lottoState.selectedNumbers.add(`${d}${u}`);
        }
      }
      showToast("🎯 Đã chọn dàn 50 số Đầu Lẻ!", "gold");
      renderLottoTray();
      updateLottoTotalWager();
    });
  }

  if (dom.btnLottoClearNumbers) {
    dom.btnLottoClearNumbers.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("selection");
      lottoState.selectedNumbers.clear();
      resetLottoMatrixDigits();
      renderLottoTray();
      updateLottoTotalWager();
      showToast("🧹 Đã xóa toàn bộ số đang chọn", "cyan");
    });
  }

  // 7. Fast Grid Cards (TAI, XIU, CHAN, LE, KEP_BANG)
  const fastCards = document.querySelectorAll(".lfg-card");
  fastCards.forEach(card => {
    const door = card.dataset.door;
    if (!door) return;

    card.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("selection");
      lottoState.fastBets[door] = (lottoState.fastBets[door] || 0) + lottoState.currentChip;
      renderFastBetsUI();
      updateLottoTotalWager();
    });

    // Right-click or long-press reset door bet
    card.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      lottoState.fastBets[door] = 0;
      renderFastBetsUI();
      updateLottoTotalWager();
      showToast(`Đã xóa cược cửa ${door}`, "cyan");
    });
  });

  // 8. Chips Selection
  const lchipBtns = document.querySelectorAll(".lchip-btn");
  lchipBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      soundEngine.init();
      soundEngine.playChip();
      telegramEngine.haptic("selection");

      if (btn.id === "btnLottoAllIn") {
        const bal = (state.session && state.session.balance) ? Math.floor(state.session.balance) : 0;
        if (bal <= 0) {
          showToast("Số dư không đủ để tất tay!", "warn");
          return;
        }
        if (lottoState.activeSubtab === "so" && lottoState.selectedNumbers.size > 0) {
          const perNum = Math.floor(bal / lottoState.selectedNumbers.size);
          lottoState.currentChip = Math.max(1, perNum);
        } else {
          lottoState.currentChip = bal;
        }
        lchipBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderLottoTray();
        updateLottoTotalWager();
        return;
      }

      const val = parseInt(btn.dataset.chip, 10);
      if (val) {
        lottoState.currentChip = val;
        lchipBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderLottoTray();
        updateLottoTotalWager();
      }
    });
  });

  // 9. Submit Ticket Button
  if (dom.btnSubmitLottoTicket) {
    dom.btnSubmitLottoTicket.addEventListener("click", submitLottoTicket);
  }

  // Initial UI refresh
  renderLottoTray();
  updateLottoTotalWager();
}

function switchLottoSubtab(subtab) {
  soundEngine.init();
  soundEngine.playChip();
  telegramEngine.haptic("selection");
  lottoState.activeSubtab = subtab;

  if (dom.btnSubtabSo) dom.btnSubtabSo.classList.toggle("active", subtab === "so");
  if (dom.btnSubtabNhanh) dom.btnSubtabNhanh.classList.toggle("active", subtab === "nhanh");

  if (dom.paneLottoSo) dom.paneLottoSo.style.display = (subtab === "so") ? "block" : "none";
  if (dom.paneLottoNhanh) dom.paneLottoNhanh.style.display = (subtab === "nhanh") ? "block" : "none";
  updateLottoTotalWager();
}

function renderLottoMatrixDigits() {
  const setupRow = (container, rowKey) => {
    if (!container) return;
    container.innerHTML = "";
    for (let d = 0; d <= 9; d++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lms-digit-btn";
      btn.dataset.row = rowKey;
      btn.dataset.digit = String(d);
      btn.textContent = String(d);
      btn.addEventListener("click", () => handleMatrixDigitClick(rowKey, d, btn));
      container.appendChild(btn);
    }
  };

  setupRow(dom.lmsDigitsTram, "tram");
  setupRow(dom.lmsDigitsChuc, "chuc");
  setupRow(dom.lmsDigitsDonVi, "donVi");
}

function handleMatrixDigitClick(rowKey, digit, btnEl) {
  soundEngine.init();
  soundEngine.playChip();
  telegramEngine.haptic("selection");

  // Toggle selection
  if (lottoState.matrixDigits[rowKey] === digit) {
    lottoState.matrixDigits[rowKey] = null;
  } else {
    lottoState.matrixDigits[rowKey] = digit;
  }

  // Update button active state in that row
  const parent = btnEl.parentElement;
  if (parent) {
    parent.querySelectorAll(".lms-digit-btn").forEach(b => {
      b.classList.toggle("active", lottoState.matrixDigits[rowKey] === parseInt(b.dataset.digit, 10));
    });
  }

  // Check if complete number is formed
  const is3D = lottoState.selectedBetType === "BA_CANG";
  const { tram, chuc, donVi } = lottoState.matrixDigits;

  if (is3D) {
    if (tram !== null && chuc !== null && donVi !== null) {
      const numStr = `${tram}${chuc}${donVi}`;
      lottoState.selectedNumbers.add(numStr);
      showToast(`🎯 Đã thêm 3 Càng: <strong>${numStr}</strong>`, "gold");
      resetLottoMatrixDigits();
      renderLottoTray();
      updateLottoTotalWager();
    }
  } else {
    if (chuc !== null && donVi !== null) {
      const numStr = `${chuc}${donVi}`;
      const betName = lottoState.selectedBetType === "DE_DAU" ? "Đề Đầu" : "Đề Đuôi";
      lottoState.selectedNumbers.add(numStr);
      showToast(`🎯 Đã thêm ${betName}: <strong>${numStr}</strong>`, "gold");
      resetLottoMatrixDigits();
      renderLottoTray();
      updateLottoTotalWager();
    }
  }
}

function resetLottoMatrixDigits() {
  lottoState.matrixDigits = { tram: null, chuc: null, donVi: null };
  document.querySelectorAll(".lms-digit-btn").forEach(b => b.classList.remove("active"));
}

function addCustomLottoNumbers() {
  if (!dom.inputLottoCustomNumbers) return;
  const raw = dom.inputLottoCustomNumbers.value.trim();
  if (!raw) return;

  const tokens = raw.split(/[\s,;|]+/).map(t => t.trim().replace(/\D/g, "")).filter(Boolean);
  if (tokens.length === 0) {
    showToast("Vui lòng nhập các chữ số hợp lệ!", "warn");
    return;
  }

  const is3D = lottoState.selectedBetType === "BA_CANG";
  let addedCount = 0;

  tokens.forEach(tok => {
    let formatted = tok;
    if (is3D) {
      if (formatted.length <= 3) {
        formatted = formatted.padStart(3, "0");
        lottoState.selectedNumbers.add(formatted);
        addedCount++;
      }
    } else {
      if (formatted.length <= 2) {
        formatted = formatted.padStart(2, "0");
        lottoState.selectedNumbers.add(formatted);
        addedCount++;
      }
    }
  });

  dom.inputLottoCustomNumbers.value = "";
  if (addedCount > 0) {
    soundEngine.init();
    soundEngine.playChip();
    telegramEngine.haptic("selection");
    showToast(`✅ Đã thêm <strong>${addedCount}</strong> số vào dàn!`, "gold");
    renderLottoTray();
    updateLottoTotalWager();
  } else {
    showToast(`Các số nhập không hợp lệ cho chế độ ${is3D ? "3 Càng (3 số)" : "Đề 2D (2 số)"}!`, "warn");
  }
}

function renderLottoTray() {
  const count = lottoState.selectedNumbers.size;
  if (dom.lstCount) dom.lstCount.textContent = count;
  const estWager = count * lottoState.currentChip;
  if (dom.lstEstWager) dom.lstEstWager.textContent = estWager.toLocaleString();

  if (!dom.lstChipsWrap) return;
  if (count === 0) {
    dom.lstChipsWrap.innerHTML = `<span class="lst-empty-hint">Chưa chọn số nào. Bấm vào các hàng số ở trên hoặc tự gõ số.</span>`;
    return;
  }

  const sortedNumbers = Array.from(lottoState.selectedNumbers).sort();
  dom.lstChipsWrap.innerHTML = sortedNumbers.map(n => `
    <div class="lst-chip" data-num="${n}">
      <span>${n}</span>
      <button type="button" class="lst-chip-del" data-num="${n}" title="Xóa số này">&times;</button>
    </div>
  `).join("");

  dom.lstChipsWrap.querySelectorAll(".lst-chip-del").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const num = btn.dataset.num;
      if (num) {
        lottoState.selectedNumbers.delete(num);
        renderLottoTray();
        updateLottoTotalWager();
      }
    });
  });
}

function renderFastBetsUI() {
  document.querySelectorAll(".lfg-card").forEach(card => {
    const door = card.dataset.door;
    const amt = lottoState.fastBets[door] || 0;
    const valEl = document.getElementById(`lfgBet${door}`);
    if (valEl) {
      valEl.textContent = amt > 0 ? `${amt.toLocaleString()} Xu` : "0";
    }
    card.classList.toggle("selected", amt > 0);
  });
}

function updateLottoTotalWager() {
  let numberWager = 0;
  if (lottoState.selectedNumbers.size > 0) {
    numberWager = lottoState.selectedNumbers.size * lottoState.currentChip;
  }
  const fastWager = Object.values(lottoState.fastBets).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const totalWager = numberWager + fastWager;

  if (dom.lottoTotalWagerVal) {
    dom.lottoTotalWagerVal.textContent = `${totalWager.toLocaleString()} Xu`;
    const bal = state.session?.balance || 0;
    dom.lottoTotalWagerVal.style.color = (totalWager > bal) ? "#ef4444" : "#ffd700";
  }
}

function tickLottoChannelsTimers() {
  const now = Date.now();
  const channels = [
    { id: "30s", cycle: 30 },
    { id: "60s", cycle: 60 },
    { id: "3m",  cycle: 180 },
    { id: "60m", cycle: 3600 }
  ];

  channels.forEach(ch => {
    const elapsed = Math.floor(now / 1000) % ch.cycle;
    const left = ch.cycle - elapsed;
    const el = document.getElementById("lchTimer" + ch.id);
    if (el) {
      if (ch.cycle >= 3600) {
        const m = Math.floor(left / 60);
        el.textContent = `${m}m`;
      } else if (ch.cycle >= 180) {
        const m = Math.floor(left / 60);
        const s = left % 60;
        el.textContent = `${m}m${s < 10 ? "0" + s : s}s`;
      } else {
        el.textContent = `${left}s`;
      }
    }
  });

  // Also smooth round banner countdown if we have current round
  if (lottoState.currentRound && lottoState.currentRound.time_left_sec > 0) {
    lottoState.currentRound.time_left_sec = Math.max(0, lottoState.currentRound.time_left_sec - 1);
    if (dom.lottoTimerVal) {
      dom.lottoTimerVal.textContent = `${lottoState.currentRound.time_left_sec}s`;
    }
    if (dom.lottoProgressBar) {
      const totalDur = lottoState.currentRound.phase === "betting"
        ? (lottoState.currentRound.betting_duration_sec || 45)
        : (lottoState.currentRound.draw_duration_sec || 5);
      const pct = Math.max(0, Math.min(100, (lottoState.currentRound.time_left_sec / totalDur) * 100));
      dom.lottoProgressBar.style.width = `${pct}%`;
    }
  }
}

async function syncLottoState() {
  if (state.gamePlayMode !== "lotto") return;
  try {
    const ch = lottoState.currentChannel || "60s";
    const roomId = state.currentRoomId || "public";
    const uid = getLiveUserId();
    const uname = getLiveUserName();

    const res = await fetch(`/api/lotto/state?channel=${ch}&room_id=${encodeURIComponent(roomId)}&user_id=${encodeURIComponent(uid)}&username=${encodeURIComponent(uname)}`);
    const json = await res.json();
    if (json.status !== "success" || !json.data) return;

    const data = json.data;
    lottoState.currentRound = data.round;

    // Update balance & meters
    if (typeof data.user_balance === "number" && state.session) {
      state.session.balance = data.user_balance;
      updateMeters();
    }

    // Render Banner & Countdown inside Lotto Betting Board
    if (data.round) {
      if (dom.lottoRoundId) dom.lottoRoundId.textContent = data.round.round_id;
      if (dom.lottoTimerVal) dom.lottoTimerVal.textContent = `${data.round.time_left_sec}s`;

      const phase = data.round.phase;
      if (dom.lottoPhasePill && dom.lottoPhaseText) {
        dom.lottoPhasePill.className = `lrb-phase-pill ${phase}`;
        if (phase === "betting") {
          dom.lottoPhaseText.textContent = "ĐANG NHẬN VÉ";
          if (dom.btnSubmitLottoTicket) {
            dom.btnSubmitLottoTicket.disabled = false;
            dom.btnSubmitLottoTicket.innerHTML = `🎟️ XÁC NHẬN ĐẶT VÉ`;
          }
          if (dom.btnSpin) dom.btnSpin.disabled = false;
        } else if (phase === "drawing") {
          dom.lottoPhaseText.textContent = "ĐANG QUAY THƯỞNG 🎰";
          if (dom.btnSubmitLottoTicket) {
            dom.btnSubmitLottoTicket.disabled = true;
            dom.btnSubmitLottoTicket.innerHTML = `⏳ ĐANG QUAY THƯỞNG...`;
          }
          if (dom.btnSpin) dom.btnSpin.disabled = true;
        } else if (phase === "payout") {
          dom.lottoPhaseText.textContent = "TRẢ THƯỞNG 🎉";
          if (dom.btnSubmitLottoTicket) {
            dom.btnSubmitLottoTicket.disabled = true;
            dom.btnSubmitLottoTicket.innerHTML = `🎉 TRẢ THƯỞNG`;
          }
          if (dom.btnSpin) dom.btnSpin.disabled = true;
        }
      }

      // Progress bar percentage
      if (dom.lottoProgressBar && data.round.total_cycle_sec > 0) {
        const pct = Math.max(0, Math.min(100, (data.round.time_left_sec / data.round.total_cycle_sec) * 100));
        dom.lottoProgressBar.style.width = `${pct}%`;
      }

      // Display official outcome digits on reels if available
      if ((phase === "drawing" || phase === "payout") && data.round.outcome) {
        if (lottoState.lastDrawnRoundId !== data.round.round_id) {
          lottoState.lastDrawnRoundId = data.round.round_id;
          runLottoReelSpin(data.round.outcome.digits, data.round.outcome);
        }
      } else if (phase === "betting") {
        if (!state.isSpinning && data.roadmap && data.roadmap.length > 0) {
          const lastOutcome = data.roadmap[0];
          if (lastOutcome && Array.isArray(lastOutcome.digits) && lastOutcome.digits.length >= 5) {
            const curCenter = state.currentGrid ? state.currentGrid[1] : null;
            const digitsMatch = curCenter && curCenter.every((d, i) => d === lastOutcome.digits[i]);
            if (!digitsMatch) {
              const digits = lastOutcome.digits;
              const grid = [
                digits.map(d => (d + 9) % 10),
                [...digits],
                digits.map(d => (d + 1) % 10)
              ];
              state.currentGrid = grid;
              for (let c = 0; c < 5; c++) {
                renderReelStatic(c, [grid[0][c], grid[1][c], grid[2][c]]);
              }
              dom.resSum.textContent = `Giải ĐB: ${digits.join("")}`;
              dom.resTaiXiu.textContent = `${lastOutcome.is_tai ? "TÀI" : "XỈU"} (${lastOutcome.de_duoi})`;
              dom.resChanLe.textContent = lastOutcome.is_chan ? "CHẴN ĐUÔI" : "LẺ ĐUÔI";
              dom.resHand.textContent = `Đề Đuôi: ${lastOutcome.de_duoi} | 3 Càng: ${lastOutcome.ba_cang} | Đề Đầu: ${lastOutcome.de_dau}`;
            }
          }
        }
      }
    }

    // Process user settlement of previous round
    if (data.user_last_settlement) {
      handleLottoSettlement(data.user_last_settlement, data.user_balance);
    }

    // Render Roadmap Table
    if (Array.isArray(data.roadmap)) {
      renderLottoRoadmap(data.roadmap);
    }

    // Render Active Placed Ticket (Vé đã cược kỳ này)
    lottoState.currentActiveTicket = data.user_current_bet;
    renderLottoActiveTicket(data.user_current_bet, data.round?.outcome, data.round?.phase);
    updateMeters();

  } catch (err) {
    console.error("syncLottoState error:", err);
  }
}

async function runLottoReelSpin(digits, outcome) {
  if (!Array.isArray(digits) || digits.length < 5) return;
  if (lottoState.isSpinningReels) return;
  lottoState.isSpinningReels = true;
  state.isSpinning = true;

  soundEngine.init();
  soundEngine.playSpin();

  dom.resHand.textContent = "ĐANG QUAY GIẢI ĐẶC BIỆT 5D...";
  clearWinningHighlights();
  dom.winPillsList.innerHTML = "";
  if (dom.winBanner) dom.winBanner.classList.remove("show");

  const prevGrid = state.currentGrid || [
    [1, 2, 3, 4, 5],
    [7, 7, 7, 8, 9],
    [8, 8, 8, 9, 1]
  ];

  const grid = [
    digits.map(d => (d + 9) % 10),
    [...digits],
    digits.map(d => (d + 1) % 10)
  ];

  const reelPromises = [];
  for (let c = 0; c < 5; c++) {
    const p = new Promise(resolve => {
      const strip = document.getElementById(`reel-${c}`);
      if (!strip) return resolve();

      const targetNums = [grid[0][c], grid[1][c], grid[2][c]];
      const prevNums = [prevGrid[0][c], prevGrid[1][c], prevGrid[2][c]];
      const targetTop = targetNums[0];
      const prevTop = prevNums[0];

      let delta = (prevTop - targetTop) % 10;
      if (delta < 0) delta += 10;
      const fullLoops = 3 + c * 2;
      const totalItems = delta + fullLoops * 10 + 3;

      const stripNums = [];
      for (let i = 0; i < totalItems; i++) {
        stripNums.push((targetTop + i) % 10);
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
      const duration = 0.85 + c * 0.28;
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
  lottoState.isSpinningReels = false;

  // Cập nhật kết quả chi tiết lên Marquee của Cabinet
  if (outcome) {
    dom.resSum.textContent = `Giải ĐB: ${digits.join("")}`;
    dom.resTaiXiu.textContent = `${outcome.is_tai ? "TÀI" : "XỈU"} (${outcome.de_duoi})`;
    dom.resChanLe.textContent = outcome.is_chan ? "CHẴN ĐUÔI" : "LẺ ĐUÔI";
    dom.resHand.textContent = `Đề Đuôi: ${outcome.de_duoi} | 3 Càng: ${outcome.ba_cang} | Đề Đầu: ${outcome.de_dau}`;

    // Highlight 2 chữ số cuối (Đề Đuôi - Cuộn 3 & 4)
    [3, 4].forEach(col => {
      const strip = document.getElementById(`reel-${col}`);
      if (strip) {
        const centerCell = strip.querySelector(".row-center");
        if (centerCell) {
          centerCell.classList.add("cell-win-highlight");
          if (!centerCell.querySelector(".cell-win-badge")) {
            const badge = document.createElement("span");
            badge.className = "cell-win-badge";
            badge.textContent = "🎯 ĐỀ";
            centerCell.appendChild(badge);
          }
        }
      }
    });
  }
}

function renderLottoRoadmap(roadmap) {
  if (!dom.lottoRoadmapBody) return;
  if (!roadmap || roadmap.length === 0) {
    dom.lottoRoadmapBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:12px;color:#64748b;">Đang tải dữ liệu kỳ quay...</td></tr>`;
    return;
  }

  dom.lottoRoadmapBody.innerHTML = roadmap.slice(0, 20).map(item => `
    <tr>
      <td style="font-weight:700;color:#94a3b8">${item.round_id}</td>
      <td><strong style="letter-spacing:2px;color:#fff">${(item.digits || []).join("")}</strong></td>
      <td class="lrc-tag-de">${item.de_duoi}</td>
      <td style="color:#cbd5e1">${item.de_dau}</td>
      <td><strong style="color:#38bdf8">${item.ba_cang}</strong></td>
      <td><span class="${item.is_tai ? "lrc-tag-tai" : "lrc-tag-xiu"}">${item.is_tai ? "Tài" : "Xỉu"}</span></td>
      <td><span class="${item.is_chan ? "lrc-tag-chan" : "lrc-tag-le"}">${item.is_chan ? "Chẵn" : "Lẻ"}</span></td>
    </tr>
  `).join("");
}

function renderLottoActiveTicket(ticket, outcome, phase) {
  if (!dom.lottoActiveTicketCard) return;

  if (!ticket || !ticket.bets || (ticket.total_bet || 0) <= 0) {
    dom.lottoActiveTicketCard.style.display = "none";
    if (dom.lottoMyTicketBadge) dom.lottoMyTicketBadge.style.display = "none";
    return;
  }

  // Show ticket card & header badge
  dom.lottoActiveTicketCard.style.display = "flex";
  if (dom.lottoMyTicketBadge) {
    dom.lottoMyTicketBadge.style.display = "inline-flex";
    if (dom.lottoMyTicketBadgeVal) {
      dom.lottoMyTicketBadgeVal.textContent = `${(ticket.total_bet || 0).toLocaleString()} Xu`;
    }
  }

  if (dom.latTotalWager) {
    dom.latTotalWager.textContent = `${(ticket.total_bet || 0).toLocaleString()} Xu`;
  }

  // Phase badge
  if (dom.latPhaseBadge) {
    if (phase === "betting") {
      dom.latPhaseBadge.className = "lat-phase-badge pending";
      dom.latPhaseBadge.textContent = "⏳ ĐANG CHỜ MỞ THƯỞNG";
    } else if (phase === "drawing") {
      dom.latPhaseBadge.className = "lat-phase-badge drawing";
      dom.latPhaseBadge.textContent = "🎰 ĐANG QUAY THƯỞNG...";
    } else if (phase === "payout") {
      dom.latPhaseBadge.className = "lat-phase-badge won";
      dom.latPhaseBadge.textContent = "🎉 KẾT QUẢ KỲ QUAY";
    }
  }

  // If in betting phase and we have bets, update Marquee to show active ticket!
  if (phase === "betting" && !state.isSpinning) {
    if (dom.resHand) {
      dom.resHand.textContent = `🎟️ Vé của bạn: ${(ticket.total_bet || 0).toLocaleString()} Xu (Đang chờ quay)`;
    }
  }

  if (!dom.latBody) return;

  const bets = ticket.bets || {};
  let html = "";

  // 1. Đề Đuôi (x95)
  if (bets.DE_DUOI && Array.isArray(bets.DE_DUOI.numbers) && bets.DE_DUOI.numbers.length > 0) {
    const amt = bets.DE_DUOI.amount_per_num || 10;
    const winningNum = outcome ? outcome.de_duoi : null;
    html += `
      <div class="lat-row">
        <div class="lat-row-head">
          <span class="lat-type-tag de-duoi">🎯 ĐỀ ĐUÔI (x95) • ${bets.DE_DUOI.numbers.length} số</span>
          <span class="lat-amt-tag">${amt.toLocaleString()} Xu/số</span>
        </div>
        <div class="lat-chips-wrap">
          ${bets.DE_DUOI.numbers.map(n => {
            const isWon = outcome && winningNum && String(n).padStart(2, "0") === String(winningNum).padStart(2, "0");
            return `<span class="lat-chip num ${isWon ? 'won' : ''}">${n}${isWon ? '<span class="lat-chip-win-badge">✨ TRÚNG</span>' : ''}</span>`;
          }).join("")}
        </div>
      </div>
    `;
  }

  // 2. Đề Đầu (x95)
  if (bets.DE_DAU && Array.isArray(bets.DE_DAU.numbers) && bets.DE_DAU.numbers.length > 0) {
    const amt = bets.DE_DAU.amount_per_num || 10;
    const winningNum = outcome ? outcome.de_dau : null;
    html += `
      <div class="lat-row">
        <div class="lat-row-head">
          <span class="lat-type-tag de-dau">🎯 ĐỀ ĐẦU (x95) • ${bets.DE_DAU.numbers.length} số</span>
          <span class="lat-amt-tag">${amt.toLocaleString()} Xu/số</span>
        </div>
        <div class="lat-chips-wrap">
          ${bets.DE_DAU.numbers.map(n => {
            const isWon = outcome && winningNum && String(n).padStart(2, "0") === String(winningNum).padStart(2, "0");
            return `<span class="lat-chip num ${isWon ? 'won' : ''}">${n}${isWon ? '<span class="lat-chip-win-badge">✨ TRÚNG</span>' : ''}</span>`;
          }).join("")}
        </div>
      </div>
    `;
  }

  // 3. 3 Càng (x900)
  if (bets.BA_CANG && Array.isArray(bets.BA_CANG.numbers) && bets.BA_CANG.numbers.length > 0) {
    const amt = bets.BA_CANG.amount_per_num || 10;
    const winningNum = outcome ? outcome.ba_cang : null;
    html += `
      <div class="lat-row">
        <div class="lat-row-head">
          <span class="lat-type-tag ba-cang">⭐ 3 CÀNG (x900) • ${bets.BA_CANG.numbers.length} số</span>
          <span class="lat-amt-tag">${amt.toLocaleString()} Xu/số</span>
        </div>
        <div class="lat-chips-wrap">
          ${bets.BA_CANG.numbers.map(n => {
            const isWon = outcome && winningNum && String(n).padStart(3, "0") === String(winningNum).padStart(3, "0");
            return `<span class="lat-chip num ${isWon ? 'won' : ''}">${n}${isWon ? '<span class="lat-chip-win-badge">✨ TRÚNG</span>' : ''}</span>`;
          }).join("")}
        </div>
      </div>
    `;
  }

  // 4. Cược Nhanh (TAI, XIU, CHAN, LE, KEP_BANG)
  const fastDoors = [
    { key: "TAI", label: "Tài Đuôi (50-99)", mult: "x1.98", check: (o) => o?.analysis?.side === "TAI" },
    { key: "XIU", label: "Xỉu Đuôi (00-49)", mult: "x1.98", check: (o) => o?.analysis?.side === "XIU" },
    { key: "CHAN", label: "Chẵn Đuôi", mult: "x1.98", check: (o) => o?.analysis?.parity === "CHAN" },
    { key: "LE", label: "Lẻ Đuôi", mult: "x1.98", check: (o) => o?.analysis?.parity === "LE" },
    { key: "KEP_BANG", label: "Kép Bằng", mult: "x9.5", check: (o) => o?.analysis?.is_kep_bang === true }
  ];

  const activeFast = fastDoors.filter(d => Number(bets[d.key]) > 0);
  if (activeFast.length > 0) {
    html += `
      <div class="lat-row">
        <div class="lat-row-head">
          <span class="lat-type-tag fast">⚡ CƯỢC NHANH</span>
        </div>
        <div class="lat-chips-wrap">
          ${activeFast.map(d => {
            const amt = Number(bets[d.key]);
            const isWon = outcome && d.check(outcome);
            return `<span class="lat-chip door ${isWon ? 'won' : ''}">${d.label}: ${amt.toLocaleString()} Xu (${d.mult})${isWon ? '<span class="lat-chip-win-badge">✨ TRÚNG</span>' : ''}</span>`;
          }).join("")}
        </div>
      </div>
    `;
  }

  dom.latBody.innerHTML = html;
}

function handleLottoSettlement(settlement, newBalance) {
  if (!settlement || !settlement.payout) return;
  if (lottoState.lastSettledRoundId === settlement.round_id) return;
  lottoState.lastSettledRoundId = settlement.round_id;

  const payout = settlement.payout;
  if (newBalance !== undefined && state.session) {
    state.session.balance = newBalance;
    updateMeters(payout.total_won);
  }

  if (payout.total_won > 0) {
    soundEngine.playBigWin();
    telegramEngine.haptic("warning");
    const firstHit = payout.win_details[0] || {};
    const winTitle = firstHit.title || "Trúng Xổ Số";

    showToast(`🏆 <strong>XỔ SỐ #${settlement.round_id}</strong>: Chúc mừng bạn trúng <strong>${winTitle}</strong> (+${payout.total_won.toLocaleString()} Xu)!`, "gold");

    if (dom.winBanner) {
      dom.winBannerTitle.textContent = payout.total_won >= 5000 ? "NỔ ĐỀ / SIÊU THẮNG!" : "TRÚNG THƯỞNG!";
      dom.winBannerAmount.textContent = `+${payout.total_won.toLocaleString()}`;
      dom.winBannerDesc.textContent = `${winTitle} • Kỳ #${settlement.round_id}`;
      dom.winBanner.style.display = "block";
      dom.winBanner.classList.add("show");
    }

    state.lastShareSlip = {
      round_id: settlement.round_id,
      amount: payout.total_won,
      hand: `Xổ Số: ${winTitle}`
    };

    if (dom.shareWinContainer) {
      dom.shareWinContainer.style.display = "block";
      if (dom.quickShareWinText) {
        dom.quickShareWinText.textContent = `KHOE CHIẾN TÍCH XỔ SỐ (+${payout.total_won.toLocaleString()} Xu) LÊN CHAT`;
      }
    }
  } else {
    showToast(`Kỳ Xổ Số #${settlement.round_id}: Không trúng. Chúc bạn may mắn kỳ sau!`, "warn");
  }
}

async function submitLottoTicket() {
  soundEngine.init();
  telegramEngine.haptic("medium");

  const round = lottoState.currentRound;
  if (round && round.phase !== "betting") {
    showToast("⚠️ Kỳ quay đang mở thưởng, vui lòng chờ kỳ tiếp theo!", "warn");
    return;
  }
  if (round && round.time_left_sec <= 2) {
    showToast("⚠️ Hết thời gian đặt vé kỳ này (chốt số trước 2 giây)!", "warn");
    return;
  }

  const bets = {};
  let totalNumbers = 0;

  if (lottoState.selectedNumbers.size > 0) {
    const arr = Array.from(lottoState.selectedNumbers);
    bets[lottoState.selectedBetType] = {
      numbers: arr,
      amount_per_num: lottoState.currentChip
    };
    totalNumbers += arr.length;
  }

  Object.entries(lottoState.fastBets).forEach(([door, amt]) => {
    if (amt > 0) bets[door] = amt;
  });

  const totalWager = (totalNumbers * lottoState.currentChip) +
    Object.values(lottoState.fastBets).reduce((a, b) => a + (Number(b) || 0), 0);

  if (totalWager <= 0) {
    showToast("Vui lòng chọn ít nhất 1 số hoặc 1 cửa Cược Nhanh!", "warn");
    return;
  }

  const curBal = state.session?.balance || 0;
  if (curBal < totalWager) {
    showToast(`Số dư không đủ (Cần ${totalWager.toLocaleString()} Xu)!`, "error");
    return;
  }

  if (dom.btnSubmitLottoTicket) {
    dom.btnSubmitLottoTicket.disabled = true;
    dom.btnSubmitLottoTicket.textContent = "ĐANG XỬ LÝ VÉ...";
  }

  try {
    const payload = {
      channel: lottoState.currentChannel,
      room_id: state.currentRoomId || "public",
      user_id: getLiveUserId(),
      username: getLiveUserName(),
      bets: bets
    };

    const res = await fetch("/api/lotto/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (json.status === "success") {
      soundEngine.playChip();
      telegramEngine.haptic("success");
      showToast(`🎟️ Đã đặt vé thành công! Tổng cược: <strong>${totalWager.toLocaleString()} Xu</strong>`, "gold");

      if (json.data && typeof json.data.balance === "number" && state.session) {
        state.session.balance = json.data.balance;
        updateMeters();
      }

      // Clear ticket inputs
      lottoState.selectedNumbers.clear();
      resetLottoMatrixDigits();
      lottoState.fastBets = { TAI: 0, XIU: 0, CHAN: 0, LE: 0, KEP_BANG: 0 };
      renderFastBetsUI();
      renderLottoTray();
      updateLottoTotalWager();

      syncLottoState();
    } else {
      showToast(json.detail || "Không thể đặt vé, vui lòng thử lại!", "error");
    }
  } catch (err) {
    showToast("Lỗi gửi vé: " + err.message, "error");
  } finally {
    if (dom.btnSubmitLottoTicket) {
      dom.btnSubmitLottoTicket.disabled = false;
      dom.btnSubmitLottoTicket.textContent = "🎟️ XÁC NHẬN ĐẶT VÉ";
    }
  }
}

function startLottoPolling() {
  if (lottoState.pollTimer) clearInterval(lottoState.pollTimer);
  syncLottoState();
  lottoState.pollTimer = setInterval(syncLottoState, 1500);
}

function stopLottoPolling() {
  if (lottoState.pollTimer) {
    clearInterval(lottoState.pollTimer);
    lottoState.pollTimer = null;
  }
  lottoState.isSpinningReels = false;
}

window.addEventListener("DOMContentLoaded", init);

