import { useMemo } from 'react';
import type { Problem } from '../types';

interface Props {
  problems: Problem[];
  sections: string[];
}

interface SectionStats {
  name: string;
  solved: number;
  total: number;
}

export default function SolveStats({ problems, sections }: Props) {
  const stats = useMemo(() => {
    const totalSolved = problems.filter((p) => p.status === 'full').length;
    const total = problems.length;

    const perSection: SectionStats[] = sections.map((name) => {
      const sectionProblems = problems.filter((p) => p.section === name);
      const solved = sectionProblems.filter((p) => p.status === 'full').length;
      return { name, solved, total: sectionProblems.length };
    });

    return { totalSolved, total, perSection };
  }, [problems, sections]);

  if (problems.length === 0) return null;

  const overallPct = Math.round((stats.totalSolved / stats.total) * 100);

  return (
    <div className="section">
      <div className="section-title">Solve Ratio</div>

      <div className="stats-overall">
        <div className="stats-overall-text">
          <span>Overall</span>
          <span className="stats-fraction">{stats.totalSolved} / {stats.total}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      <div className="stats-sections">
        {stats.perSection.map((s) => {
          const pct = s.total > 0 ? Math.round((s.solved / s.total) * 100) : 0;
          return (
            <div key={s.name} className="stats-section-row">
              <div className="stats-section-info">
                <span className="stats-section-name">{s.name}</span>
                <span className="stats-fraction">{s.solved}/{s.total}</span>
              </div>
              <div className="progress-bar progress-bar-sm">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
