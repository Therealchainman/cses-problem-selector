import type { Submission, CsesSubmissions } from '../sidebar/types';

export function setupSubmissionDetector() {
  let initialized = false;

  window.addEventListener('load', () => {
    setTimeout(() => { initialized = true; }, 800);
  });

  // If page already loaded (document_idle), initialize after delay
  if (document.readyState === 'complete') {
    setTimeout(() => { initialized = true; }, 800);
  }

  const observer = new MutationObserver((mutations) => {
    if (!initialized) return;

    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        const el = node as Element;
        if (el.classList?.contains('task-score') || el.querySelector?.('.task-score')) {
          observer.disconnect();
          recordSubmission();
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
}

function recordSubmission() {
  const urlMatch = window.location.pathname.match(/\/task\/(\d+)/);
  if (!urlMatch) return;

  const problemId = urlMatch[1];
  const problemName = document.querySelector('h1')?.textContent?.trim() || 'Unknown';

  // Try to extract result from the page
  let result = 'unknown';
  const verdict = document.querySelector('.task-score');
  if (verdict) {
    if (verdict.classList.contains('full')) result = 'accepted';
    else if (verdict.classList.contains('zero')) result = 'wrong';
    else if (verdict.classList.contains('partial')) result = 'partial';
  }

  const submission: Submission = {
    problemId,
    problemName,
    timestamp: Date.now(),
    result,
  };

  chrome.storage.local.get('csesSubmissions', (res) => {
    const data: CsesSubmissions = res.csesSubmissions || { entries: [] };
    data.entries.unshift(submission);
    if (data.entries.length > 50) data.entries = data.entries.slice(0, 50);
    chrome.storage.local.set({ csesSubmissions: data });
  });
}
