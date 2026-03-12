/**
 * @typedef {{ id: string, name: string, section: string, status: 'full'|'partial'|'zero'|'none' }} Problem
 * @typedef {{ problems: Problem[], lastUpdated: number, username: string }} StoredData
 * @typedef {{ mode: 'countdown'|'stopwatch', limitSeconds: number, startedAt: number|null, accumulatedMs: number, running: boolean }} TimerState
 */

// ─── State ────────────────────────────────────────────────────────────────────

/** @type {Problem[]} */
let allProblems = [];
/** @type {Problem[]} */
let currentPool = [];
/** @type {Problem|null} */
let currentProblem = null;
/** @type {TimerState} */
let timer = {
  mode: 'countdown',
  limitSeconds: 1500,
  startedAt: null,
  accumulatedMs: 0,
  running: false
};
let timerInterval = null;

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

const syncStatus        = $('sync-status');
const bannerStale       = $('banner-stale');
const bannerNotLoggedIn = $('banner-not-logged-in');
const bannerFetching    = $('banner-fetching');
const emptyState        = $('empty-state');
const mainContent       = $('main-content');

const accountName = $('account-name');
const btnLogin    = $('btn-login');
const btnSync     = $('btn-sync');

const filterStatus  = $('filter-status');
const filterSection = $('filter-section');
const btnRoll       = $('btn-roll');
const statsBar      = $('stats-bar');

const problemCard        = $('problem-card');
const problemName        = $('problem-name');
const problemMeta        = $('problem-meta');
const problemStatusBadge = $('problem-status-badge');
const btnGo              = $('btn-go');
const btnReroll          = $('btn-reroll');
const noMatch            = $('no-match');

const modeCountdown   = $('mode-countdown');
const modeStopwatch   = $('mode-stopwatch');
const timerLimitRow   = $('timer-limit-row');
const timerLimitInput = $('timer-limit');
const timerDisplay    = $('timer-display');
const btnTimerStart   = $('btn-timer-start');
const btnTimerPause   = $('btn-timer-pause');
const btnTimerReset   = $('btn-timer-reset');

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatMs(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Filter logic ─────────────────────────────────────────────────────────────

/**
 * @param {Problem[]} problems
 * @param {string} statusFilter
 * @param {string} sectionFilter
 * @returns {Problem[]}
 */
function getFilteredProblems(problems, statusFilter, sectionFilter) {
  return problems.filter(p => {
    const statusOk = statusFilter === 'any'
      || (statusFilter === 'solved'   && p.status === 'full')
      || (statusFilter === 'unsolved' && (p.status === 'zero' || p.status === 'none'))
      || (statusFilter === 'partial'  && p.status === 'partial');
    const sectionOk = sectionFilter === 'all' || p.section === sectionFilter;
    return statusOk && sectionOk;
  });
}

function updateStats() {
  const section = filterSection.value;
  const totalSolved = allProblems.filter(p => p.status === 'full').length;
  const total = allProblems.length;

  let html = `<span class="stats-item"><span class="stats-label">Overall:</span> <span class="stats-value stats-fraction">${totalSolved} / ${total}</span></span>`;

  if (section !== 'all') {
    const sectionProblems = allProblems.filter(p => p.section === section);
    const sectionSolved = sectionProblems.filter(p => p.status === 'full').length;
    html += `<span class="stats-item"><span class="stats-label">${section}:</span> <span class="stats-value stats-fraction">${sectionSolved} / ${sectionProblems.length}</span></span>`;
  }

  statsBar.innerHTML = html;
}

function rebuildPool() {
  const filtered = getFilteredProblems(allProblems, filterStatus.value, filterSection.value);
  currentPool = shuffle(filtered);
  currentProblem = null;
  problemCard.classList.add('hidden');
  noMatch.classList.add('hidden');
  updateStats();
}

// ─── Problem display ──────────────────────────────────────────────────────────

const STATUS_LABELS = { full: 'Solved', partial: 'Partial', zero: 'Attempted', none: 'Unsolved' };

function showProblem(problem) {
  currentProblem = problem;
  problemName.textContent = problem.name;
  problemMeta.textContent = `${problem.section} · #${problem.id}`;

  const label = STATUS_LABELS[problem.status] || 'Unknown';
  problemStatusBadge.textContent = label;
  problemStatusBadge.className = `status-badge status-${problem.status}`;

  problemCard.classList.remove('hidden');
  noMatch.classList.add('hidden');
}

function rollProblem() {
  if (currentPool.length === 0) {
    const filtered = getFilteredProblems(allProblems, filterStatus.value, filterSection.value);
    if (filtered.length === 0) {
      problemCard.classList.add('hidden');
      noMatch.classList.remove('hidden');
      return;
    }
    currentPool = shuffle(filtered);
  }
  const problem = currentPool.pop();
  showProblem(problem);
}

// ─── Section dropdown ─────────────────────────────────────────────────────────

function populateSections(problems) {
  const seen = new Set();
  const sections = [];
  for (const p of problems) {
    if (!seen.has(p.section)) {
      seen.add(p.section);
      sections.push(p.section);
    }
  }

  filterSection.innerHTML = '<option value="all">All Sections</option>';
  for (const sec of sections) {
    const opt = document.createElement('option');
    opt.value = sec;
    opt.textContent = sec;
    filterSection.appendChild(opt);
  }
}

// ─── Account UI ───────────────────────────────────────────────────────────────

function updateAccountUI(username) {
  if (username) {
    accountName.textContent = username;
    accountName.classList.remove('hidden');
    btnLogin.classList.add('hidden');
    btnSync.classList.remove('hidden');
  } else {
    accountName.classList.add('hidden');
    btnLogin.classList.remove('hidden');
    btnSync.classList.add('hidden');
  }
}

function setFetching(active) {
  bannerFetching.classList.toggle('hidden', !active);
}

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadData() {
  const result = await chrome.storage.local.get('csesData');
  /** @type {StoredData|undefined} */
  const data = result.csesData;

  if (!data || !data.problems || data.problems.length === 0) {
    emptyState.classList.remove('hidden');
    mainContent.classList.add('hidden');
    updateAccountUI('');
    return;
  }

  setFetching(false);
  emptyState.classList.add('hidden');
  mainContent.classList.remove('hidden');

  allProblems = data.problems;
  syncStatus.textContent = `Last synced: ${timeAgo(data.lastUpdated)}`;

  updateAccountUI(data.username || '');

  const stale = Date.now() - data.lastUpdated > 24 * 60 * 60 * 1000;
  bannerStale.classList.toggle('hidden', !stale);

  const hasStatusData = data.problems.some(p => p.status !== 'none');
  const notLoggedIn = !data.username && !hasStatusData;
  bannerNotLoggedIn.classList.toggle('hidden', !notLoggedIn);

  populateSections(allProblems);
  rebuildPool();
}

function requestSync() {
  setFetching(true);
  chrome.runtime.sendMessage({ type: 'FETCH_DATA' });
}

// ─── Timer ────────────────────────────────────────────────────────────────────

function getElapsedMs() {
  return timer.accumulatedMs + (timer.running && timer.startedAt ? Date.now() - timer.startedAt : 0);
}

function getRemainingMs() {
  const limitMs = timer.limitSeconds * 1000;
  return limitMs - getElapsedMs();
}

function updateTimerDisplay() {
  if (timer.mode === 'stopwatch') {
    timerDisplay.textContent = formatMs(getElapsedMs());
    timerDisplay.classList.remove('expired');
  } else {
    const remaining = getRemainingMs();
    timerDisplay.textContent = formatMs(remaining);
    timerDisplay.classList.toggle('expired', remaining <= 0);
  }
}

function saveTimer() {
  chrome.storage.local.set({ csesTimer: timer });
}

async function loadTimer() {
  const result = await chrome.storage.local.get('csesTimer');
  if (result.csesTimer) {
    timer = result.csesTimer;
    modeCountdown.checked = timer.mode === 'countdown';
    modeStopwatch.checked = timer.mode === 'stopwatch';
    timerLimitInput.value = String(Math.round(timer.limitSeconds / 60));
    timerLimitRow.classList.toggle('hidden', timer.mode === 'stopwatch');
    updateTimerDisplay();
    updateTimerButtons();
    if (timer.running) {
      startDisplayInterval();
    }
  }
}

function startDisplayInterval() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    updateTimerDisplay();
    if (timer.mode === 'countdown' && getRemainingMs() <= 0) {
      stopTimer();
    }
  }, 250);
}

function stopDisplayInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function stopTimer() {
  stopDisplayInterval();
  timer.accumulatedMs = timer.limitSeconds * 1000;
  timer.running = false;
  timer.startedAt = null;
  saveTimer();
  updateTimerDisplay();
  updateTimerButtons();
}

function updateTimerButtons() {
  btnTimerStart.disabled = timer.running;
  btnTimerPause.disabled = !timer.running;
}

function startTimer() {
  if (timer.running) return;

  if (timer.mode === 'countdown') {
    const remaining = getRemainingMs();
    if (remaining <= 0) return;
    chrome.alarms.create('timer-complete', { when: Date.now() + remaining });
  }

  timer.startedAt = Date.now();
  timer.running = true;
  saveTimer();
  updateTimerButtons();
  startDisplayInterval();
}

function pauseTimer() {
  if (!timer.running) return;
  chrome.alarms.clear('timer-complete');
  timer.accumulatedMs = getElapsedMs();
  timer.startedAt = null;
  timer.running = false;
  saveTimer();
  stopDisplayInterval();
  updateTimerDisplay();
  updateTimerButtons();
}

function resetTimer() {
  chrome.alarms.clear('timer-complete');
  stopDisplayInterval();
  timer.accumulatedMs = 0;
  timer.startedAt = null;
  timer.running = false;
  saveTimer();
  updateTimerDisplay();
  updateTimerButtons();
}

// ─── Event listeners ──────────────────────────────────────────────────────────

btnLogin.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_LOGIN' });
});

$('btn-login-empty').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_LOGIN' });
});

btnSync.addEventListener('click', requestSync);

$('btn-sync-empty').addEventListener('click', requestSync);

btnRoll.addEventListener('click', rollProblem);
btnReroll.addEventListener('click', rollProblem);

btnGo.addEventListener('click', () => {
  if (currentProblem) {
    chrome.tabs.create({ url: `https://cses.fi/problemset/task/${currentProblem.id}` });
  }
});

filterStatus.addEventListener('change', rebuildPool);
filterSection.addEventListener('change', rebuildPool);

// Timer mode change
[modeCountdown, modeStopwatch].forEach(radio => {
  radio.addEventListener('change', () => {
    resetTimer();
    timer.mode = radio.value;
    timerLimitRow.classList.toggle('hidden', timer.mode === 'stopwatch');
    updateTimerDisplay();
    saveTimer();
  });
});

// Time limit input
timerLimitInput.addEventListener('change', () => {
  const val = Math.max(1, Math.min(999, parseInt(timerLimitInput.value, 10) || 25));
  timerLimitInput.value = String(val);
  resetTimer();
  timer.limitSeconds = val * 60;
  updateTimerDisplay();
  saveTimer();
});

btnTimerStart.addEventListener('click', startTimer);
btnTimerPause.addEventListener('click', pauseTimer);
btnTimerReset.addEventListener('click', resetTimer);

// Listen for background messages
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'DATA_UPDATED') {
    loadData();
  } else if (msg.type === 'LOGIN_SUCCESS') {
    setFetching(true);
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

loadData();
loadTimer();
