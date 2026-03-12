/**
 * Runs on cses.fi/problemset/task/* pages.
 * Watches for new submission result elements appearing after the page loads,
 * then triggers a data refresh so the popup reflects the new solve status.
 */
(function () {
  let initialized = false;

  // Ignore score elements that were already on the page at load time
  window.addEventListener('load', () => {
    setTimeout(() => { initialized = true; }, 800);
  });

  const observer = new MutationObserver((mutations) => {
    if (!initialized) return;

    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        // A new score element means a submission result just appeared
        if (
          node.classList?.contains('task-score') ||
          node.querySelector?.('.task-score')
        ) {
          observer.disconnect();
          try {
            chrome.runtime.sendMessage({ type: 'FETCH_DATA' });
          } catch (_) {
            // Extension context may be gone
          }
          return;
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
