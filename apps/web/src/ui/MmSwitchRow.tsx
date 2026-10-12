import './ui.css';

interface MmSwitchRowProps {
  title: string;
  subtitle?: string | undefined;
  value: boolean;
  onChange: (value: boolean) => void;
  /** No horizontal padding, for use inside a padded group. */
  flush?: boolean;
}

/** A labelled on/off setting. */
export function MmSwitchRow({ title, subtitle, value, onChange, flush = false }: MmSwitchRowProps) {
  return (
    <label className={`mm-toggle-row${flush ? ' mm-toggle-row-flush' : ''}`}>
      <span className="mm-list-row-text">
        <span className="mm-list-row-title">{title}</span>
        {subtitle === undefined ? null : <span className="mm-list-row-subtitle">{subtitle}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="mm-switch"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
