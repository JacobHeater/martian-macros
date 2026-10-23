import { type ReactNode, useId, useState } from 'react';
import { MmIcon } from './MmIcon';
import type { MmIconName } from './MmIconName';
import { MmPressable } from './MmPressable';
import { useFold } from './useFold';
import './ui.css';

interface MmSectionProps {
  /** The section's mark (MM-253, rule 2): 24 dp beside its title, never alone. */
  icon: MmIconName;
  title: string;
  /**
   * What the section is about, beyond routine: a caution's section keeps the
   * caution colour on its icon, so it never reads as routine, folded or open (MM-553).
   */
  kind?: 'caution';
  /** The section, header and rows, sits on one card: for a screen of many sections whose rows are words (the Coach, owner). */
  framed?: boolean;
  /**
   * The rows bring their own icon column, under the header's: they start at the section's edge rather than under its
   * title, so a row's icon stands under the section's mark and its words under the title (Food, MM-569).
   */
  flush?: boolean;
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
  /** Names the fold to the app, which keeps it as it was left across visits (MM-286). */
  remember?: string;
  /** The header opens something else (a screen) instead of folding. */
  onPress?: (() => void) | undefined;
  /** With `onPress`: where it goes, said after the title and summary ("Opens Food", MM-335). */
  opens?: string;
  children?: ReactNode;
}

/**
 * A section of a screen (MM-253, rule 1): an icon and a heading on the
 * canvas with its rows beneath, where a card used to be. It is the second
 * tier; the hero is the first and a disclosure inside it the third. A
 * section is never drawn on a surface, so nothing nests in a card; a framed
 * section is the card itself (the Coach, MM-558).
 */
export function MmSection({
  icon,
  title,
  kind,
  framed = false,
  flush = false,
  summary,
  meter,
  trailing,
  collapsible = false,
  initiallyExpanded = true,
  maintainState = false,
  remember,
  onPress,
  opens,
  children,
}: MmSectionProps) {
  const [expanded, setExpanded] = useFold(remember, initiallyExpanded);
  // A section with nothing to fold forgets an old fold, so its first rows are not hidden (MM-389).
  const [couldFold, setCouldFold] = useState(collapsible);
  if (couldFold !== collapsible) {
    setCouldFold(collapsible);
    if (!collapsible) setExpanded(initiallyExpanded);
  }
  /** How many times the section has been opened, which draws the meter anew. */
  const [opened, setOpened] = useState(0);
  const toggle = () => {
    if (!expanded) setOpened(opened + 1);
    setExpanded(!expanded);
  };
  const id = useId();
  const open = !collapsible || expanded;
  // A header that opens or folds is a button inside the heading, so the heading stays one (MM-335, MM-399).
  const Title = onPress === undefined && !collapsible ? 'h2' : 'span';
  const words = (
    <span className="mm-section-words">
      <Title className="mm-section-title" id={`${id}-title`}>
        {title}
      </Title>
      {summary === undefined ? null : (
        <span className="mm-section-summary" id={`${id}-summary`}>
          {summary}
        </span>
      )}
      {onPress === undefined || opens === undefined ? null : (
        <span className="mm-visually-hidden" id={`${id}-opens`}>
          {opens}
        </span>
      )}
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
      <h2 className="mm-section-heading">
        <MmPressable
          label={title}
          describedBy={
            [summary === undefined ? undefined : `${id}-summary`, opens === undefined ? undefined : `${id}-opens`]
              .filter((part) => part !== undefined)
              .join(' ') || undefined
          }
          onPress={onPress}
        >
          <span className="mm-section-head-body">
            {head}
            <span className="mm-section-opens" aria-hidden="true">
              <MmIcon name="chevronRight" size={20} />
            </span>
          </span>
        </MmPressable>
      </h2>
    );
  } else if (collapsible) {
    header = (
      // Named by its title alone, as the plain heading is; the button inside also carries the summary.
      <h2 className="mm-section-heading" aria-labelledby={`${id}-title`}>
        <MmPressable expanded={expanded} controls={`${id}-body`} onPress={toggle}>
          <span className="mm-section-head-body">
            {head}
            <span className={`mm-disclosure-chevron${expanded ? ' mm-disclosure-chevron-open' : ''}`}>
              <MmIcon name="chevronDown" size={16} />
            </span>
          </span>
        </MmPressable>
      </h2>
    );
  } else {
    header = <span className="mm-section-head-body">{head}</span>;
  }
  return (
    // A header that opens a screen has no rows under it, so it stacks with the folded headers as one list (MM-402).
    <section
      className={`mm-section${kind === undefined ? '' : ` mm-section-${kind}`}${framed ? ' mm-section-framed' : ''}${flush ? ' mm-section-flush' : ''}${open && onPress === undefined ? '' : ' mm-section-closed'}`}
      aria-labelledby={`${id}-title`}
    >
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
