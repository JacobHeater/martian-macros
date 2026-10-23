import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { MmIconButton } from './MmIconButton';
import { trapFocus } from './trapFocus';
import { useVisibleArea } from './useVisibleArea';
import './ui.css';

interface MmSheetProps {
  /** What a person hears on arriving. */
  label: string;
  children: ReactNode;
  /** Called when the sheet is closed without an answer (Close, Escape, a drag down, or a press outside). */
  onDismiss: () => void;
  /** "tall" keeps one height whatever it holds, so it does not jump as its content changes (MM-566). */
  size?: 'fit' | 'tall' | undefined;
}

/** How far the handle is dragged down before letting go closes the sheet. */
const dismissAtPx = 80;

/**
 * A panel that comes up from the bottom of the screen, over what is there.
 * It always has a visible way out, a Close action, and its handle drags it
 * away (MM-271); focus stays inside it until it closes. It stands above
 * the on-screen keyboard, inside what is left in sight (MM-566).
 */
export function MmSheet({ label, children, onDismiss, size = 'fit' }: MmSheetProps) {
  const hidden = useVisibleArea();
  const panel = useRef<HTMLDivElement>(null);
  const dragFrom = useRef<number | undefined>(undefined);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const before = document.activeElement;
    panel.current?.focus();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragFrom.current === undefined) return;
    const dragged = event.clientY - dragFrom.current;
    dragFrom.current = undefined;
    setOffset(0);
    if (dragged >= dismissAtPx) onDismiss();
  };

  return (
    <div
      className="mm-scrim mm-scrim-sheet"
      style={hidden.top > 0 || hidden.bottom > 0 ? { paddingTop: hidden.top, paddingBottom: hidden.bottom } : undefined}
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
      <div
        ref={panel}
        className={`mm-sheet${size === 'tall' ? ' mm-sheet-tall' : ''}${offset > 0 ? ' mm-sheet-dragging' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={offset > 0 ? { transform: `translateY(${offset}px)` } : undefined}
      >
        <div className="mm-sheet-head">
          <div
            className="mm-sheet-grip"
            onPointerDown={(event) => {
              dragFrom.current = event.clientY;
              event.currentTarget.setPointerCapture?.(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (dragFrom.current !== undefined) setOffset(Math.max(0, event.clientY - dragFrom.current));
            }}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span className="mm-sheet-handle" aria-hidden="true" />
          </div>
          <span className="mm-sheet-close">
            <MmIconButton icon="close" label="Close" onPress={onDismiss} />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
