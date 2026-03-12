import { createRoot } from 'react-dom/client';
import { parseProblems, getUsername } from './parser';
import { setupSubmissionDetector } from './submissionDetector';
import App from '../sidebar/App';
import sidebarCSS from '../sidebar/sidebar.css?inline';

// Parse problem data on the list page
const isListPage = /\/problemset\/list/.test(window.location.pathname);
const isTaskPage = /\/problemset\/task\/\d+/.test(window.location.pathname);

if (isListPage) {
  const problems = parseProblems();
  const username = getUsername();
  if (problems.length > 0) {
    chrome.storage.local.set({
      csesData: { problems, lastUpdated: Date.now(), username },
    });
  }
}

if (isTaskPage) {
  setupSubmissionDetector();
}

// Inject sidebar on all problemset pages
const host = document.createElement('div');
host.id = 'cses-finder-root';
document.body.appendChild(host);
const shadow = host.attachShadow({ mode: 'closed' });

const style = document.createElement('style');
style.textContent = sidebarCSS;
shadow.appendChild(style);

const container = document.createElement('div');
shadow.appendChild(container);
const root = createRoot(container);
root.render(<App />);
