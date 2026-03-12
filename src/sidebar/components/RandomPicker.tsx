import { useCallback, useEffect, useRef } from 'react';
import { useStorage } from '../hooks/useStorage';
import type { Problem, RandomPickerState } from '../types';

interface Props {
  problems: Problem[];
  sections: string[];
}

const DEFAULT_PICKER_STATE: RandomPickerState = {
  statusFilter: 'any',
  sectionFilter: 'all',
  currentProblem: null,
  pool: [],
  noMatch: false,
};

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

function sanitizeProblem(problem: Problem | null, validProblems: Map<string, Problem>): Problem | null {
  if (!problem) return null;
  return validProblems.get(problem.id) ?? null;
}

function sanitizePool(pool: Problem[], validProblems: Map<string, Problem>): Problem[] {
  return pool
    .map((problem) => validProblems.get(problem.id))
    .filter((problem): problem is Problem => problem !== undefined);
}

export default function RandomPicker({ problems, sections }: Props) {
  const [pickerState, setPickerState] = useStorage<RandomPickerState>(
    'csesRandomPickerState',
    DEFAULT_PICKER_STATE,
  );
  const poolRef = useRef<Problem[]>(pickerState.pool);
  const { statusFilter, sectionFilter, currentProblem, noMatch } = pickerState;

  useEffect(() => {
    poolRef.current = pickerState.pool;
  }, [pickerState.pool]);

  useEffect(() => {
    const validProblems = new Map(problems.map((problem) => [problem.id, problem]));
    const nextSection =
      pickerState.sectionFilter === 'all' || sections.includes(pickerState.sectionFilter)
        ? pickerState.sectionFilter
        : 'all';
    const nextCurrentProblem = sanitizeProblem(pickerState.currentProblem, validProblems);
    const nextPool = sanitizePool(pickerState.pool, validProblems);
    const hasChanges =
      nextSection !== pickerState.sectionFilter ||
      nextCurrentProblem !== pickerState.currentProblem ||
      nextPool.length !== pickerState.pool.length;

    if (!hasChanges) {
      return;
    }

    poolRef.current = nextPool;
    setPickerState({
      ...pickerState,
      sectionFilter: nextSection,
      currentProblem: nextCurrentProblem,
      pool: nextPool,
      noMatch: pickerState.noMatch && nextCurrentProblem === null && nextPool.length === 0,
    });
  }, [pickerState, problems, sections, setPickerState]);

  const roll = useCallback(() => {
    let nextPool = poolRef.current;
    if (nextPool.length === 0) {
      const filtered = getFiltered(problems, pickerState.statusFilter, pickerState.sectionFilter);
      if (filtered.length === 0) {
        poolRef.current = [];
        setPickerState({
          ...pickerState,
          currentProblem: null,
          pool: [],
          noMatch: true,
        });
        return;
      }
      nextPool = shuffle(filtered);
    }

    const selectedProblem = nextPool[nextPool.length - 1];
    const remainingPool = nextPool.slice(0, -1);
    poolRef.current = remainingPool;
    setPickerState({
      ...pickerState,
      currentProblem: selectedProblem,
      pool: remainingPool,
      noMatch: false,
    });
  }, [pickerState, problems, setPickerState]);

  const handleStatusChange = (val: string) => {
    poolRef.current = [];
    setPickerState({
      statusFilter: val as RandomPickerState['statusFilter'],
      sectionFilter,
      currentProblem: null,
      pool: [],
      noMatch: false,
    });
  };

  const handleSectionChange = (val: string) => {
    poolRef.current = [];
    setPickerState({
      statusFilter,
      sectionFilter: val,
      currentProblem: null,
      pool: [],
      noMatch: false,
    });
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
      {!currentProblem && (
        <div className="filter-actions">
          <button className="btn btn-primary" onClick={roll}>Roll</button>
        </div>
      )}

      {currentProblem && (
        <div className="problem-card">
          <a
            className="problem-card-link"
            href={`https://cses.fi/problemset/task/${currentProblem.id}`}
            target="_self"
          >
            <div className="problem-name">{currentProblem.name}</div>
          </a>
          <div className="problem-meta">{currentProblem.section} &middot; #{currentProblem.id}</div>
          <div className={`status-badge status-${currentProblem.status}`}>
            {STATUS_LABELS[currentProblem.status] || 'Unknown'}
          </div>
          <div className="problem-actions">
            <a
              className="btn btn-primary btn-solve"
              href={`https://cses.fi/problemset/task/${currentProblem.id}`}
              target="_self"
            >
              Solve →
            </a>
            <button className="btn btn-ghost" onClick={roll}>Re-roll</button>
          </div>
        </div>
      )}

      {noMatch && <div className="no-match">No problems match your filters.</div>}
    </div>
  );
}
