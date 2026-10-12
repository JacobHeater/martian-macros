import { MmIcon } from './MmIcon';
import './ui.css';

interface ChoiceCardProps {
  label: string;
  detail?: string | undefined;
  badge?: string | undefined;
  selected: boolean;
  dense?: boolean;
  onPress: () => void;
}

/** A selectable card used for single-choice questions. */
export function ChoiceCard({ label, detail, badge, selected, dense = false, onPress }: ChoiceCardProps) {
  return (
    <button
      type="button"
      className={`mm-choice-card${selected ? ' mm-choice-card-selected' : ''}${dense ? ' mm-choice-card-dense' : ''}`}
      aria-pressed={selected}
      onClick={onPress}
    >
      <span className="mm-list-row-text">
        <span className="mm-choice-card-label">
          {label}
          {badge === undefined ? null : <span className="mm-badge">{badge}</span>}
        </span>
        {detail === undefined ? null : <span className="mm-choice-card-detail">{detail}</span>}
      </span>
      {selected ? (
        <span className="mm-choice-card-check">
          <MmIcon name="checkCircle" />
        </span>
      ) : null}
    </button>
  );
}
