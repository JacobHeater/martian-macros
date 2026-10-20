import './ui.css';

/**
 * A label with its value on one line. The value is a figure; what it is
 * measured against, or rests on, is the `detail` under the row (MM-342).
 */
export function StatRow({ label, value, detail }: { label: string; value: string; detail?: string | undefined }) {
  return (
    <div className={`mm-stat-row${detail === undefined ? '' : ' mm-stat-row-with-detail'}`}>
      <span className="mm-stat-label">{label}</span>
      <span className="mm-stat-value">{value}</span>
      {detail === undefined ? null : <span className="mm-stat-detail">{detail}</span>}
    </div>
  );
}
