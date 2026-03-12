import type { Submission } from '../types';

interface Props {
  submissions: Submission[];
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const RESULT_CLASSES: Record<string, string> = {
  accepted: 'result-accepted',
  wrong: 'result-wrong',
  partial: 'result-partial',
  unknown: 'result-unknown',
};

export default function SubmissionHistory({ submissions }: Props) {
  if (submissions.length === 0) {
    return (
      <div className="section">
        <div className="section-title">Recent Submissions</div>
        <div className="no-match">No submissions recorded yet.</div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="section-title">Recent Submissions</div>
      <div className="submission-list">
        {submissions.map((sub, i) => (
          <a
            key={`${sub.problemId}-${sub.timestamp}-${i}`}
            className="submission-item"
            href={`https://cses.fi/problemset/task/${sub.problemId}`}
            target="_self"
          >
            <div className="submission-name">{sub.problemName}</div>
            <div className="submission-info">
              <span className={`submission-result ${RESULT_CLASSES[sub.result] || 'result-unknown'}`}>
                {sub.result}
              </span>
              <span className="submission-time">{timeAgo(sub.timestamp)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
