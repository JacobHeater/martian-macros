import './charts.css';

interface MiniTrendProps {
  values: readonly number[];
  min: number;
  max: number;
  /** How many points the width allows for, so a short series does not stretch. */
  slots: number;
  /** What the line says, for a screen reader. */
  label: string;
}

const width = 96;
const height = 24;
const dot = 2.5;

/**
 * A small line of a few values on a fixed scale, oldest on the left, with a
 * dot at each point over a faint baseline. The drawing is decoration: its
 * meaning is carried by `label` and the text beside it.
 */
export function MiniTrend({ values, min, max, slots, label }: MiniTrendProps) {
  const top = dot;
  const bottom = height - dot;
  const step = slots <= 1 ? 0 : (width - 2 * dot) / (slots - 1);
  const at = (i: number) => {
    const share = max === min ? 0.5 : ((values[i] as number) - min) / (max - min);
    return [dot + step * i, bottom - (bottom - top) * share] as const;
  };
  const points = values.map((_, i) => at(i));
  return (
    <svg className="chart-mini" viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={label}>
      <line className="chart-mini-base" x1={0} x2={width} y1={bottom} y2={bottom} />
      {points.length > 1 ? <polyline className="chart-mini-line" points={points.map((p) => p.join(',')).join(' ')} /> : null}
      {points.map(([x, y], i) => (
        <circle key={i} className="chart-mini-dot" cx={x} cy={y} r={dot} />
      ))}
    </svg>
  );
}
