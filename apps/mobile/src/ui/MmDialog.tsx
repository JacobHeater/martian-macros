import { type ReactNode, useEffect, useId, useRef } from 'react';
import { trapFocus } from './trapFocus';
import './ui.css';

interface MmDialogProps {
  title: string;
  children: ReactNode;
  /** The buttons, quieter one first. */
  actions?: ReactNode;
  /** Called when the dialog is closed without an answer (Escape, or a press outside). */
  onDismiss: () => void;
}

/**
 * A question over the screen. Focus moves into it and stays inside until it
 * closes (MM-271); Escape closes it unanswered from anywhere.
 */
export function MmDialog({ title, children, actions, onDismiss }: MmDialogProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const before = document.activeElement;
    // The keyboard lands where the question is: the chosen day of a calendar, the first drum, else the first control.
    const first = panel.current?.querySelector<HTMLElement>(
      '[autofocus], [role="gridcell"][tabindex="0"], [role="spinbutton"], input, select, button',
    );
    (first ?? panel.current)?.focus();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);

  // Escape with focus nowhere (after a control inside was removed, say)
  // still closes the question on top.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.activeElement !== document.body) return;
      const scrims = document.querySelectorAll('.mm-scrim, .mm-menu-scrim');
      if (scrims[scrims.length - 1] === panel.current?.parentElement) onDismiss();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div
      className="mm-scrim"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onDismiss();
        } else if (panel.current !== null) {
          trapFocus(event, panel.current);
        }
      }}
    >
      <div ref={panel} className="mm-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <h2 id={titleId} className="mm-dialog-title">
          {title}
        </h2>
        <div className="mm-dialog-body">{children}</div>
        {actions === undefined ? null : <div className="mm-dialog-actions">{actions}</div>}
      </div>
    </div>
  );
}
