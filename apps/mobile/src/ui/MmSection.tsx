import { type ReactNode, useId, useState } from 'react';
import { MmIcon } from './MmIcon';
import type { MmIconName } from './MmIconName';
import { MmPressable } from './MmPressable';
import './ui.css';

interface MmSectionProps {
  /** The section's mark (MM-253, rule 2): 24 dp beside its title, never alone. */
  icon: MmIconName;
  title: string;
  /** One line under the title: the section's state in words, read whether it is open or not. */
  summary?: ReactNode;
  /**
   * A graphic of the summary (MM-326) under the header, across the
   * section; it stays when the section folds, as the summary does, and is
   * drawn anew each time the section opens, so a bar fills again.
   */
  meter?: ReactNode;
  /** An action of the header's own (add, history), beside the title. */
  trailing?: ReactNode;
  /** The header folds the rows beneath it; closed, the summary is all that shows. */
  collapsible?: boolean;
  initiallyExpanded?: boolean;
  /** Keeps what is inside alive while folded, so it does not start over. */
  maintainState?: boolean;
  /** The header opens something else (a screen) instead of folding. */
  onPress?: (() => void) | undefined;
  children?: ReactNode;
}

/**
 * A section of a screen (MM-253, rule 1): an icon and a heading on the
 * canvas with its rows beneath, where a card used to be. It is the second
 * tier; the hero is the first and a disclosure inside it the third. A
 * section is never drawn on a surface, so nothing nests in a card.
 */
export function MmSection({
  icon,
  title,
  summary,
  meter,
  trailing,
  collapsible = false,
  initiallyExpanded = true,
  maintainState = false,
  onPress,
  children,
}: MmSectionProps) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  /** How many times the section has been opened, which draws the meter anew. */
  const [opened, setOpened] = useState(0);
  const toggle = () => {
    if (!expanded) setOpened(opened + 1);
    setExpanded(!expanded);
  };
  const id = useId();
  const open = !collapsible || expanded;
  const words = (
    <span className="mm-section-words">
      <h2 className="mm-section-title" id={`${id}-title`}>
        {title}
      </h2>
      {summary === undefined ? null : <span className="mm-section-summary">{summary}</span>}
    </span>
  );
  const head = (
    <>
      <span className="mm-section-icon" aria-hidden="true">
        <MmIcon name={icon} />
      </span>
      {words}
    </>
  );
  let header: ReactNode;
  if (onPress !== undefined) {
    header = (
      <MmPressable label={title} onPress={onPress}>
        <span className="mm-section-head-body">
          {head}
          <span className="mm-section-opens" aria-hidden="true">
            <MmIcon name="chevronRight" size={20} />
          </span>
        </span>
      </MmPressable>
    );
  } else if (collapsible) {
    header = (
      <MmPressable expanded={expanded} controls={`${id}-body`} onPress={toggle}>
        <span className="mm-section-head-body">
          {head}
          <span className={`mm-disclosure-chevron${expanded ? ' mm-disclosure-chevron-open' : ''}`}>
            <MmIcon name="chevronDown" size={16} />
          </span>
        </span>
      </MmPressable>
    );
  } else {
    header = <span className="mm-section-head-body">{head}</span>;
  }
  return (
    <section className="mm-section" aria-labelledby={`${id}-title`}>
      <div className="mm-section-head">
        <div className="mm-section-head-main">{header}</div>
        {trailing}
      </div>
      {meter === undefined ? null : (
        <div key={opened} className="mm-section-meter">
          {meter}
        </div>
      )}
      {children === undefined ? null : (
        <div id={`${id}-body`} className="mm-section-body" hidden={!open}>
          {open || maintainState ? children : null}
        </div>
      )}
    </section>
  );
}
