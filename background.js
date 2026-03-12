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

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId !== loginTabId || !changeInfo.url) return;

  const url = changeInfo.url;
  // Login succeeded when we leave the login page and land somewhere on cses.fi
  if (!url.includes('/login') && url.startsWith('https://cses.fi/')) {
    loginTabId = null;
    chrome.tabs.remove(tabId);
    openDataFetchTab();
    broadcastToPopup({ type: 'LOGIN_SUCCESS' });
  }
});

// ─── Data fetch via temporary tab ─────────────────────────────────────────────

let fetchTabId = null;

function openDataFetchTab() {
  if (fetchTabId != null) return; // Already fetching
  chrome.tabs.create({ url: 'https://cses.fi/problemset/list', active: false }, (tab) => {
    fetchTabId = tab.id;
  });
}

// When the temp fetch tab's content script sends DATA_UPDATED, close the tab
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'DATA_UPDATED' && sender.tab && sender.tab.id === fetchTabId) {
    chrome.tabs.remove(fetchTabId);
    fetchTabId = null;
    broadcastToPopup({ type: 'DATA_UPDATED' });
    return;
  }

  // DATA_UPDATED from the real list page (user browsed there manually)
  if (msg.type === 'DATA_UPDATED') {
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
