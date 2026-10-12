import './ui.css';

interface StepProgressProps {
  /** Zero-based index of the current step. */
  current: number;
  count: number;
}

/**
 * Where the user is in a fixed sequence of steps: one segment per step, the
 * done and current ones filled. Steps, not a percentage.
 */
export function StepProgress({ current, count }: StepProgressProps) {
  return (
    <div className="mm-steps" role="img" aria-label={`Step ${current + 1} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`mm-step${i <= current ? ' mm-step-done' : ''}`} />
      ))}
    </div>
  );
}
