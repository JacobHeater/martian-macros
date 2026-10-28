import { type PointerEvent, type ReactNode, useEffect, useRef } from 'react';
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
  /**
   * Asked before the sheet leaves on Close, Escape, a drag or a press outside (MM-631): content holding something
   * unsaved sets it, and the sheet stays unless it agrees. Read when the leaving starts, so what it holds now counts.
   */
  mayLeave?: { current: (() => Promise<boolean>) | undefined } | undefined;
}

/** How far the handle is dragged down before letting go closes the sheet. */
const dismissAtPx = 80;
/** Or this far, let go moving at least this fast: a flick (MM-675). */
const flickAtPx = 24;
const flickPxPerMs = 0.5;

interface Drag {
  readonly fromY: number;
  readonly at: number;
  y: number;
  lastAt: number;
}

/** The milliseconds a motion token stands for, read from the page; 0 where it cannot be read (the tests) or under reduced motion. */
function motionMs(token: string): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const number = Number.parseFloat(value);
  if (Number.isNaN(number)) return 0;
  return value.endsWith('ms') ? number : number * 1000;
}

/**
 * A panel that comes up from the bottom of the screen, over what is there.
 * It always has a visible way out, a Close action, and its handle drags it
 * away (MM-271); focus stays inside it until it closes. It stands above
 * the on-screen keyboard, inside what is left in sight (MM-566). Its head
 * stays put while the content scrolls under it (MM-675).
 *
 * The drag moves the panel by a transform set on the element itself, never
 * through React, so each frame costs the compositor alone; let go, it
 * springs back or leaves on a transition, and `onDismiss` is called once
 * it is off the screen (MM-675). Risen once, it never replays its rise-in:
 * a drag down and back up left the sheet flashing in again (the owner).
 */
export function MmSheet({ label, children, onDismiss, size = 'fit', mayLeave }: MmSheetProps) {
  const hidden = useVisibleArea();
  const scrim = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | undefined>(undefined);
  const leaving = useRef(false);

  useEffect(() => {
    const before = document.activeElement;
    panel.current?.focus();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);

  /** The panel slides off the bottom and the scrim fades; `onDismiss` once they have. */
  const go = () => {
    if (leaving.current) return;
    leaving.current = true;
    const element = panel.current;
    if (element === null) {
      onDismiss();
      return;
    }
    element.classList.remove('mm-sheet-dragging', 'mm-sheet-settling');
    element.classList.add('mm-sheet-leaving');
    element.style.transform = 'translate3d(0, 100%, 0)';
    scrim.current?.classList.add('mm-scrim-leaving');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      element.removeEventListener('transitionend', onEnd);
      onDismiss();
    };
    // Only the panel's own transform ending: a button inside it ends transitions of its own, and they bubble.
    const onEnd = (event: TransitionEvent) => {
      if (event.target === element && event.propertyName === 'transform') finish();
    };
    // A transition of 0 ms (reduced motion, the tests) ends without a word: it is over now.
    const ms = motionMs('--motion-slow');
    if (ms === 0) {
      finish();
      return;
    }
    element.addEventListener('transitionend', onEnd);
    setTimeout(finish, ms);
  };

  /** Leaves at once, or once what the content holds may be left (MM-631); refused, the sheet stays where it is. */
  const leave = () => {
    if (leaving.current) return;
    const asked = mayLeave?.current;
    if (asked === undefined) {
      go();
      return;
    }
    void asked().then((agreed) => {
      if (agreed) go();
    });
  };

  // Risen once, the sheet keeps the class that stops its rise-in, so taking a drag class off never replays it.
  const risen = () => panel.current?.classList.add('mm-sheet-risen');

  const follow = (y: number) => {
    const element = panel.current;
    if (element === null) return;
    element.classList.add('mm-sheet-dragging');
    element.style.transform = `translate3d(0, ${y}px, 0)`;
  };

  const settle = () => {
    const element = panel.current;
    if (element === null) return;
    element.classList.remove('mm-sheet-dragging');
    element.classList.add('mm-sheet-settling');
    element.style.transform = 'translate3d(0, 0, 0)';
    let rested = false;
    const rest = () => {
      if (rested) return;
      rested = true;
      element.removeEventListener('transitionend', onEnd);
      element.classList.remove('mm-sheet-settling');
      element.style.removeProperty('transform');
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target === element && event.propertyName === 'transform') rest();
    };
    const ms = motionMs('--motion-base');
    if (ms === 0) {
      rest();
      return;
    }
    element.addEventListener('transitionend', onEnd);
    setTimeout(rest, ms);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const from = drag.current;
    if (from === undefined) return;
    drag.current = undefined;
    const dragged = Math.max(0, event.clientY - from.fromY);
    const speed = (event.clientY - from.y) / Math.max(1, event.timeStamp - from.lastAt);
    const through = dragged >= dismissAtPx || (dragged >= flickAtPx && speed >= flickPxPerMs);
    if (through) leave();
    else settle();
  };

  return (
    <div
      ref={scrim}
      className="mm-scrim mm-scrim-sheet"
      style={hidden.top > 0 || hidden.bottom > 0 ? { paddingTop: hidden.top, paddingBottom: hidden.bottom } : undefined}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) leave();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          leave();
        } else if (panel.current !== null) {
          trapFocus(event, panel.current);
        }
      }}
    >
      <div
        ref={panel}
        className={`mm-sheet${size === 'tall' ? ' mm-sheet-tall' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) risen();
        }}
      >
        <div className="mm-sheet-head">
          <div
            className="mm-sheet-grip"
            onPointerDown={(event) => {
              if (leaving.current) return;
              risen();
              drag.current = { fromY: event.clientY, at: event.timeStamp, y: event.clientY, lastAt: event.timeStamp };
              event.currentTarget.setPointerCapture?.(event.pointerId);
            }}
            onPointerMove={(event) => {
              const from = drag.current;
              if (from === undefined) return;
              from.y = event.clientY;
              from.lastAt = event.timeStamp;
              follow(Math.max(0, event.clientY - from.fromY));
            }}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <span className="mm-sheet-handle" aria-hidden="true" />
          </div>
          <span className="mm-sheet-close">
            <MmIconButton icon="close" label="Close" onPress={leave} />
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
