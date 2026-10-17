import { useEffect, useId, useRef } from 'react';
import type { MmAnchor } from './MmAnchor';
import { MmButton } from './MmButton';
import { trapFocus } from './trapFocus';
import './ui.css';

interface MmPopoverProps {
  title: string;
  message: string;
  /** The trigger's edges; the bubble hangs under its end, or over it near the bottom of the screen. */
  anchor: MmAnchor;
  /** What a screen reader hears for it, when the title reads badly aloud; the title otherwise. */
  label?: string | undefined;
  onDone: () => void;
}

/** Room kept between the bubble and the screen's edges. */
const edgePx = 16;
/** The bubble's width, as `.mm-popover` draws it, on a screen wide enough for it. */
const widthPx = 300;
/** A height the bubble is assumed to need when choosing above or below; it grows with its words either way. */
const roughHeightPx = 160;

/**
 * A short explanation beside what was pressed (MM-370: why a food can't be
 * graded), drawn by the overlay host at the trigger's anchor so nothing can
 * clip it, as a menu is (MM-268). Focus moves into it and returns to the
 * trigger; Escape, "Got it" and a press outside close it.
 */
export function MmPopover({ title, message, anchor, label, onDone }: MmPopoverProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const before = document.activeElement;
    panel.current?.querySelector<HTMLElement>('button')?.focus();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);

  const below = anchor.bottom + roughHeightPx <= window.innerHeight - edgePx;
  // Under the trigger's end, but never past either edge of the screen (MM-372).
  const width = Math.min(widthPx, window.innerWidth - 2 * edgePx);
  const right = Math.min(Math.max(edgePx, window.innerWidth - anchor.right), window.innerWidth - edgePx - width);
  const place = below ? { top: anchor.bottom + 4, right } : { bottom: Math.max(edgePx, window.innerHeight - anchor.top + 4), right };

  return (
    <>
      <div className="mm-menu-scrim" onPointerDown={onDone} />
      <div
        ref={panel}
        className="mm-popover"
        role="dialog"
        aria-modal="true"
        aria-labelledby={label === undefined ? titleId : undefined}
        aria-label={label}
        style={{ ...place, width }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onDone();
          } else if (panel.current !== null) {
            trapFocus(event, panel.current);
          }
        }}
      >
        <h2 id={titleId} className="mm-popover-title">
          {title}
        </h2>
        <p className="mm-popover-message">{message}</p>
        <div className="mm-popover-actions">
          <MmButton label="Got it" kind="text" onPress={onDone} />
        </div>
      </div>
    </>
  );
}
