import './ui.css';

/** Compact, wrapping facts with labels rather than color-only meaning: each a label and its value. */
export function MetricFacts({ facts }: { facts: readonly (readonly [label: string, value: string])[] }) {
  return (
    <dl className="mm-metric-facts">
      {facts.map(([label, value]) => (
        <div key={label} className="mm-metric-fact">
          <dd className="mm-metric-value">{value}</dd>
          <dt className="mm-metric-label">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
