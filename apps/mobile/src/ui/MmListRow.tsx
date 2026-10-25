import type { ReactNode } from 'react';
import { MmIcon } from './MmIcon';
import type { MmIconName } from './MmIconName';
import './ui.css';

interface MmListRowProps {
  title: string;
  subtitle?: string | undefined;
  /** Shown under the title in place of `subtitle` (a slider, say). */
  detail?: ReactNode;
  leadingIcon?: MmIconName | undefined;
  /** Marks a destructive row (erase): its icon uses the danger color. */
  danger?: boolean;
  trailing?: ReactNode;
  /** The row opens something: it draws the chevron itself, so no screen does (MM-278). */
  opens?: boolean;
  /**
   * An action of the row's own (delete, say), shown at its end. It sits
   * beside the part that is pressed, not inside it, so a row that opens
   * something can still carry one.
   */
  trailingAction?: ReactNode;
  onPress?: (() => void) | undefined;
  /** Takes focus when it first draws: the first row a "more" control added, so a reader goes on from it (MM-410). */
  autoFocus?: boolean;
  dense?: boolean;
  /** No horizontal padding, for use inside a padded surface; an `entry` row too. */
  flush?: boolean;
  /**
   * A control the row holds under its title (a number to enter): the row
   * is not pressed itself, its icon stays level with the title and the
   * control sits on the text column inside the row's padding (MM-291).
   */
  entry?: ReactNode;
}

/** One row of a list: a title with optional detail, icon and trailing content. */
export function MmListRow({
  title,
  subtitle,
  detail,
  leadingIcon,
  danger = false,
  trailing,
  opens = false,
  trailingAction,
  onPress,
  autoFocus = false,
  dense = false,
  flush = false,
  entry,
}: MmListRowProps) {
  if (entry !== undefined) {
    return (
      <div className={`mm-list-row mm-list-row-entry${flush ? ' mm-list-row-flush' : ''}`}>
        {leadingIcon === undefined ? null : (
          <span className="mm-list-row-leading">
            <MmIcon name={leadingIcon} />
          </span>
        )}
        <div className="mm-list-row-text">
          <span className="mm-list-row-title">{title}</span>
          {subtitle === undefined ? null : <span className="mm-list-row-subtitle">{subtitle}</span>}
          <div className="mm-list-row-entry-body">{entry}</div>
        </div>
      </div>
    );
  }
  const body = (
    <>
      {leadingIcon === undefined ? null : (
        <span className={`mm-list-row-leading${danger ? ' mm-danger' : ''}`}>
          <MmIcon name={leadingIcon} />
        </span>
      )}
      <span className="mm-list-row-text">
        <span className="mm-list-row-title">{title}</span>
        {detail ?? (subtitle === undefined ? null : <span className="mm-list-row-subtitle">{subtitle}</span>)}
      </span>
      {trailing === undefined && !opens ? null : (
        <span className="mm-list-row-trailing">
          {trailing}
          {opens ? (
            <span className="mm-list-row-opens" aria-hidden="true">
              <MmIcon name="chevronRight" />
            </span>
          ) : null}
        </span>
      )}
    </>
  );
  const className = `mm-list-row${dense ? ' mm-list-row-dense' : ''}${flush ? ' mm-list-row-flush' : ''}`;
  if (trailingAction !== undefined) {
    return (
      <div className={`${className} mm-list-row-with-action`}>
        {onPress === undefined ? (
          <div className="mm-list-row-main">{body}</div>
        ) : (
          <button type="button" className="mm-list-row-main mm-list-row-button" onClick={onPress} autoFocus={autoFocus}>
            {body}
          </button>
        )}
        {trailingAction}
      </div>
    );
  }
  return onPress === undefined ? (
    <div className={className}>{body}</div>
  ) : (
    <button type="button" className={`${className} mm-list-row-button`} onClick={onPress} autoFocus={autoFocus}>
      {body}
    </button>
  );
}
