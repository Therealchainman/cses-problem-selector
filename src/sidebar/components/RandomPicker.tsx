import { useState, useCallback, useRef } from 'react';
import type { Problem } from '../types';

interface Props {
  problems: Problem[];
  sections: string[];
}

const STATUS_LABELS: Record<string, string> = {
  full: 'Solved',
  partial: 'Partial',
  zero: 'Attempted',
  none: 'Unsolved',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getFiltered(problems: Problem[], status: string, section: string): Problem[] {
  return problems.filter((p) => {
    const statusOk =
      status === 'any' ||
      (status === 'solved' && p.status === 'full') ||
      (status === 'unsolved' && (p.status === 'zero' || p.status === 'none')) ||
      (status === 'partial' && p.status === 'partial');
    const sectionOk = section === 'all' || p.section === section;
    return statusOk && sectionOk;
  });
}

export default function RandomPicker({ problems, sections }: Props) {
  const [statusFilter, setStatusFilter] = useState('any');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const poolRef = useRef<Problem[]>([]);

  const roll = useCallback(() => {
    if (poolRef.current.length === 0) {
      const filtered = getFiltered(problems, statusFilter, sectionFilter);
      if (filtered.length === 0) {
        setCurrentProblem(null);
        setNoMatch(true);
        return;
      }
      poolRef.current = shuffle(filtered);
    }
    setNoMatch(false);
    setCurrentProblem(poolRef.current.pop()!);
  }, [problems, statusFilter, sectionFilter]);

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    poolRef.current = [];
    setCurrentProblem(null);
    setNoMatch(false);
  };

  const handleSectionChange = (val: string) => {
    setSectionFilter(val);
    poolRef.current = [];
    setCurrentProblem(null);
    setNoMatch(false);
  };

  return (
    <div className="section">
      <div className="section-title">Random Problem</div>
      <div className="filter-row">
        <label>Status</label>
        <select value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)}>
          <option value="any">Any</option>
          <option value="unsolved">Unsolved</option>
          <option value="solved">Solved</option>
          <option value="partial">Partial</option>
        </select>
      </div>
      <div className="filter-row">
        <label>Section</label>
        <select value={sectionFilter} onChange={(e) => handleSectionChange(e.target.value)}>
          <option value="all">All Sections</option>
          {sections.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="filter-actions">
        <button className="btn btn-primary" onClick={roll}>Roll</button>
      </div>

      {currentProblem && (
        <div className="problem-card">
          <div className="problem-name">{currentProblem.name}</div>
          <div className="problem-meta">{currentProblem.section} &middot; #{currentProblem.id}</div>
          <div className={`status-badge status-${currentProblem.status}`}>
            {STATUS_LABELS[currentProblem.status] || 'Unknown'}
          </div>
          <div className="problem-actions">
            <a
              className="btn btn-primary"
              href={`https://cses.fi/problemset/task/${currentProblem.id}`}
              target="_self"
            >
              Go
            </a>
            <button className="btn btn-secondary" onClick={roll}>Re-roll</button>
          </div>
        </div>
      )}

      {noMatch && <div className="no-match">No problems match your filters.</div>}
    </div>
  );
}
