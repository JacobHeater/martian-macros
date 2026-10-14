import './ui.css';

/**
 * Compact, wrapping facts with labels rather than color-only meaning: each
 * a label and its value, in that order in the markup so a screen reader
 * pairs them (MM-279); the value is drawn over the label.
 */
export function MetricFacts({ facts }: { facts: readonly (readonly [label: string, value: string])[] }) {
  return (
    <dl className="mm-metric-facts">
      {facts.map(([label, value]) => (
        <div key={label} className="mm-metric-fact">
          <dt className="mm-metric-label">{label}</dt>
          <dd className="mm-metric-value">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
