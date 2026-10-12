import './ui.css';

/** A label with its value on one line. */
export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mm-stat-row">
      <span className="mm-stat-label">{label}</span>
      <span className="mm-stat-value">{value}</span>
    </div>
  );
}
