// ─── Timer alarm ──────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timer-complete') {
    chrome.notifications.create('timer-done', {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'CSES Problem Finder',
      message: "Time's up!",
      priority: 2
    });
  }
});

// ─── Login flow ───────────────────────────────────────────────────────────────

let loginTabId = null;
let fetchTabId = null;

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // ── Login tab monitoring ──────────────────────────────────────────────────
  if (tabId === loginTabId && changeInfo.url) {
    // Leave login page = successful login
    if (!changeInfo.url.includes('/login') && changeInfo.url.startsWith('https://cses.fi/')) {
      loginTabId = null;
      chrome.tabs.remove(tabId);
      openDataFetchTab();
      broadcastToPopup({ type: 'LOGIN_SUCCESS' });
    }
    return;
  }

  // ── Fetch tab monitoring ──────────────────────────────────────────────────
  if (tabId === fetchTabId && changeInfo.status === 'complete') {
    chrome.tabs.get(tabId, (t) => {
      if (chrome.runtime.lastError || !t) return;

      if (t.url && t.url.match(/https:\/\/cses\.fi\/problemset\/list/)) {
        // Page loaded correctly — content.js auto-runs via manifest, but inject
        // explicitly too in case it was blocked or the tab loaded unusually.
        chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        }).catch(() => {
          // If injection fails (e.g. page is a PDF or system page), give up.
          chrome.tabs.remove(tabId);
          fetchTabId = null;
          broadcastToPopup({ type: 'FETCH_FAILED' });
        });
      } else {
        // Redirected (likely to login page) — not logged in.
        chrome.tabs.remove(tabId);
        fetchTabId = null;
        broadcastToPopup({ type: 'FETCH_FAILED' });
      }
    });
  }
});

// Clean up if user manually closes either tracked tab.
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === fetchTabId)  fetchTabId  = null;
  if (tabId === loginTabId)  loginTabId  = null;
});

// ─── Data fetch via temporary tab ─────────────────────────────────────────────

function openDataFetchTab() {
  if (fetchTabId != null) return; // already in progress
  chrome.tabs.create({ url: 'https://cses.fi/problemset/list', active: false }, (tab) => {
    fetchTabId = tab.id;
  });
}

// ─── Message routing ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'DATA_UPDATED') {
    // Close the temp fetch tab if this is the source.
    if (sender.tab && sender.tab.id === fetchTabId) {
      chrome.tabs.remove(fetchTabId);
      fetchTabId = null;
    }
    broadcastToPopup({ type: 'DATA_UPDATED' });
    return;
  }

  if (msg.type === 'OPEN_LOGIN') {
    if (loginTabId != null) {
      chrome.tabs.update(loginTabId, { active: true });
      return;
    }
    chrome.tabs.create({ url: 'https://cses.fi/login' }, (tab) => {
      loginTabId = tab.id;
    });
    return;
  }

  if (msg.type === 'FETCH_DATA') {
    openDataFetchTab();
    return;
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function broadcastToPopup(msg) {
  chrome.runtime.sendMessage(msg).catch(() => {
    // Popup may not be open; ignore
  });
}
