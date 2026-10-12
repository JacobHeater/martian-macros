import { type ReactNode, useEffect, useId, useRef } from 'react';
import './ui.css';

interface MmDialogProps {
  title: string;
  children: ReactNode;
  /** The buttons, quieter one first. */
  actions?: ReactNode;
  /** Called when the dialog is closed without an answer (Escape, or a press outside). */
  onDismiss: () => void;
}

/** A question over the screen. Focus moves into it, and Escape closes it unanswered. */
export function MmDialog({ title, children, actions, onDismiss }: MmDialogProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const before = document.activeElement;
    const first = panel.current?.querySelector<HTMLElement>('[autofocus], input, select, button');
    (first ?? panel.current)?.focus();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);

  return (
    <div
      className="mm-scrim"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <div
        ref={panel}
        className="mm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onDismiss();
          }
        }}
      >
        <h2 id={titleId} className="mm-dialog-title">
          {title}
        </h2>
        <div className="mm-dialog-body">{children}</div>
        {actions === undefined ? null : <div className="mm-dialog-actions">{actions}</div>}
      </div>
    </div>
  );
}
