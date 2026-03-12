import { useProblems } from '../hooks/useProblems';
import { useSubmissions } from '../hooks/useSubmissions';
import RandomPicker from './RandomPicker';
import SolveStats from './SolveStats';
import SubmissionHistory from './SubmissionHistory';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Sidebar() {
  const { problems, username, lastUpdated, sections } = useProblems();
  const { submissions } = useSubmissions();

  const hasData = problems.length > 0;

  return (
    <div className="sidebar">
      <div className="header">
        <div className="header-top">
          <h1>CSES Finder</h1>
          {username && <span className="account-name">{username}</span>}
        </div>
        {lastUpdated > 0 && (
          <div className="sync-status">Synced {timeAgo(lastUpdated)}</div>
        )}
      </div>

      {!hasData ? (
        <div className="empty-state">
          <p>No problem data yet.</p>
          <p>
            Visit the{' '}
            <a href="https://cses.fi/problemset/list" target="_self">
              CSES Problem Set
            </a>{' '}
            to sync your data.
          </p>
        </div>
      ) : (
        <div className="sidebar-content">
          <RandomPicker problems={problems} sections={sections} />
          <SolveStats problems={problems} sections={sections} />
          <SubmissionHistory submissions={submissions} />
        </div>
      )}
    </div>
  );
}
