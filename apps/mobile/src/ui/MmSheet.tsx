import { type ReactNode, useEffect, useRef } from 'react';
import './ui.css';

interface MmSheetProps {
  /** What a person hears on arriving. */
  label: string;
  children: ReactNode;
  /** Called when the sheet is closed without an answer (Escape, or a press outside). */
  onDismiss: () => void;
}

/** A panel that comes up from the bottom of the screen, over what is there. */
export function MmSheet({ label, children, onDismiss }: MmSheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement;
    panel.current?.focus();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);
  return (
    <div
      className="mm-scrim mm-scrim-sheet"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <div
        ref={panel}
        className="mm-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            onDismiss();
          }
        }}
      >
        <span className="mm-sheet-handle" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
