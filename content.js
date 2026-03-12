/**
 * @typedef {{ id: string, name: string, section: string, status: 'full'|'partial'|'zero'|'none' }} Problem
 * @typedef {{ problems: Problem[], lastUpdated: number, username: string }} StoredData
 */

(function () {
  /** @returns {Problem[]} */
  function parseProblems() {
    const problems = [];
    let currentSection = 'Unknown';

    const children = document.querySelectorAll('.content > *');
    for (const el of children) {
      if (el.tagName === 'H2') {
        currentSection = el.textContent.trim();
      } else if (el.tagName === 'UL' && el.classList.contains('task-list')) {
        for (const li of el.querySelectorAll('li.task')) {
          const anchor = li.querySelector('a');
          if (!anchor) continue;

          const match = anchor.href.match(/\/task\/(\d+)/);
          if (!match) continue;

          const id = match[1];
          const name = anchor.textContent.trim();
          const span = li.querySelector('span.task-score');
          let status = 'none';
          if (span) {
            if (span.classList.contains('full')) status = 'full';
            else if (span.classList.contains('partial')) status = 'partial';
            else if (span.classList.contains('zero')) status = 'zero';
          }

          problems.push({ id, name, section: currentSection, status });
        }
      }
    }
    return problems;
  }

  function getUsername() {
    const el = document.querySelector('a.account');
    return el ? el.textContent.trim() : '';
  }

  const problems = parseProblems();
  const username = getUsername();

  if (problems.length === 0) return;

  /** @type {StoredData} */
  const data = { problems, lastUpdated: Date.now(), username };

  chrome.storage.local.set({ csesData: data }, () => {
    try {
      chrome.runtime.sendMessage({ type: 'DATA_UPDATED' });
    } catch (_) {
      // Popup may not be open; ignore
    }
  });
})();
