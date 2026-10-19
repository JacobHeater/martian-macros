import { type ReactNode, useId, useState } from 'react';
import { MmIcon } from './MmIcon';
import './ui.css';

interface MmDisclosureProps {
  title: string;
  subtitle?: string | undefined;
  children: ReactNode;
  /** Shown in place of the title, with the title still said aloud. */
  header?: ReactNode;
  initiallyExpanded?: boolean;
  /** Keeps what is inside alive while closed, so it does not start over. */
  maintainState?: boolean;
}

/** A heading that opens more detail underneath: the "one tap down" layer. */
export function MmDisclosure({
  title,
  subtitle,
  children,
  header,
  initiallyExpanded = false,
  maintainState = false,
}: MmDisclosureProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const id = useId();
  return (
    <div className={`mm-disclosure${header === undefined ? '' : ' mm-disclosure-with-header'}`}>
      <button
        type="button"
        className="mm-disclosure-toggle"
        aria-expanded={expanded}
        aria-controls={id}
        aria-label={header === undefined ? undefined : title}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="mm-list-row-text">
          {header ?? <span className="mm-list-row-title">{title}</span>}
          {subtitle === undefined ? null : <span className="mm-list-row-subtitle">{subtitle}</span>}
        </span>
        <span className={`mm-disclosure-chevron${expanded ? ' mm-disclosure-chevron-open' : ''}`}>
          <MmIcon name="chevronDown" size={16} />
        </span>
      </button>
      <div id={id} className="mm-disclosure-body" hidden={!expanded}>
        {expanded || maintainState ? children : null}
      </div>
    </div>
  );
}
