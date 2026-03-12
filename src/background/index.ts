chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'FETCH_DATA') {
    // Open a background tab to the problem list page to trigger data parsing
    chrome.tabs.create({ url: 'https://cses.fi/problemset/list', active: false }, (tab) => {
      if (!tab?.id) return;
      const tabId = tab.id;

      // Close the tab after a delay to allow the content script to run
      setTimeout(() => {
        chrome.tabs.remove(tabId).catch(() => {});
      }, 5000);
    });
    sendResponse({ ok: true });
  }
});
