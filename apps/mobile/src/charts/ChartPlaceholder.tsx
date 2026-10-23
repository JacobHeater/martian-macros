import { MmIcon } from '../ui/MmIcon';
import './charts.css';

interface ChartPlaceholderProps {
  /** What the graphic will show and why it shows nothing yet, in view and aloud. */
  text: string;
  /** How far toward the first picture, when it needs more than one record: "1 of 3 measurements". */
  count?: { done: number; of: number; unit: string } | undefined;
  /** The height of a full chart, where one stands in for it; a section's graphic otherwise. */
  tall?: boolean;
}

/**
 * Where a graphic has nothing to draw yet (MM-578): its frame, faint, with
 * what it is waiting for said plainly over it, and how far along when it
 * needs several records. It never draws a value, so an empty graphic is
 * never read as a zero.
 */
export function ChartPlaceholder({ text, count, tall = false }: ChartPlaceholderProps) {
  return (
    <div className={`chart-placeholder${tall ? ' chart-placeholder-tall' : ''}`}>
      <svg className="chart-placeholder-frame" viewBox="0 0 320 100" preserveAspectRatio="none" aria-hidden="true">
        {[4, 96].map((y) => (
          <line key={y} className="chart-placeholder-grid" x1={0} x2={320} y1={y} y2={y} />
        ))}
      </svg>
      <div className="chart-placeholder-words">
        <p className="chart-placeholder-text">
          <MmIcon name="info" size={20} />
          <span>{text}</span>
        </p>
        {count === undefined ? null : (
          <p className="chart-placeholder-count">
            {`${count.done} of ${count.of} ${count.unit}`}
          </p>
        )}
      </div>
    </div>
  );
}
