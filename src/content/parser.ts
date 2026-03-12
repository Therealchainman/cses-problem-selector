import type { Problem } from '../sidebar/types';

export function parseProblems(): Problem[] {
  const problems: Problem[] = [];
  let currentSection = 'Unknown';

  const children = document.querySelectorAll('.content > *');
  for (const el of children) {
    if (el.tagName === 'H2') {
      currentSection = el.textContent?.trim() || 'Unknown';
    } else if (el.tagName === 'UL' && el.classList.contains('task-list')) {
      for (const li of el.querySelectorAll('li.task')) {
        const anchor = li.querySelector('a');
        if (!anchor) continue;

        const match = anchor.href.match(/\/task\/(\d+)/);
        if (!match) continue;

        const id = match[1];
        const name = anchor.textContent?.trim() || '';
        const span = li.querySelector('span.task-score');
        let status: Problem['status'] = 'none';
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

export function getUsername(): string {
  const el = document.querySelector('a.account');
  return el ? el.textContent?.trim() || '' : '';
}
