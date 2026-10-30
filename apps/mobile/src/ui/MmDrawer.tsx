import { type PointerEvent, type ReactNode, useEffect, useRef } from 'react';
import { trapFocus } from './trapFocus';
import './ui.css';

interface MmDrawerProps {
  /** What a person hears on arriving. */
  label: string;
  children: ReactNode;
  /** Called when the drawer is closed without an answer (Escape, a drag back, or a press on the scrim). */
  onDismiss: () => void;
}

/** How far the finger moves before the drawer decides whether it is being dragged or its content scrolled. */
const decideAtPx = 8;
/** A drag past this share of the drawer's width, let go, closes it. */
const dismissAtShare = 1 / 3;
/** Or this far, let go moving at least this fast: a flick. */
const flickAtPx = 24;
const flickPxPerMs = 0.5;

interface Drag {
  readonly fromX: number;
  readonly fromY: number;
  /** Undecided until the finger has moved `decideAtPx`; then whether it drags the drawer. */
  dragging: boolean | undefined;
  x: number;
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
 * A panel that slides in from the left side of the screen, over what is
 * there: the app's menu (MM-704), the sibling of `MmSheet`. Focus stays
 * inside it until it closes; a press on the scrim, Escape, the phone's back
 * and a drag back close it. The drag moves the panel by a transform set on
 * the element itself, never through React, so each frame costs the
 * compositor alone; let go, it springs back or leaves on a transition that
 * takes `--motion-base`, 0 under reduced motion. A finger that moves mostly
 * up or down scrolls the content and never drags.
 */
export function MmDrawer({ label, children, onDismiss }: MmDrawerProps) {
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

  /** The panel slides off the left and the scrim fades; `onDismiss` once they have. */
  const leave = () => {
    if (leaving.current) return;
    leaving.current = true;
    const element = panel.current;
    if (element === null) {
      onDismiss();
      return;
    }
    element.classList.remove('mm-drawer-dragging', 'mm-drawer-settling');
    element.classList.add('mm-drawer-leaving');
    element.style.transform = 'translate3d(-100%, 0, 0)';
    scrim.current?.classList.add('mm-scrim-leaving');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      element.removeEventListener('transitionend', onEnd);
      onDismiss();
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target === element && event.propertyName === 'transform') finish();
    };
    // A transition of 0 ms (reduced motion, the tests) ends without a word: it is over now.
    const ms = motionMs('--motion-base');
    if (ms === 0) {
      finish();
      return;
    }
    element.addEventListener('transitionend', onEnd);
    setTimeout(finish, ms);
  };

  // Arrived once, the panel keeps the class that stops its slide-in, so taking a drag class off never replays it.
  const arrived = () => panel.current?.classList.add('mm-drawer-arrived');

  const follow = (x: number) => {
    const element = panel.current;
    if (element === null) return;
    element.classList.add('mm-drawer-dragging');
    element.style.transform = `translate3d(${x}px, 0, 0)`;
  };

  const settle = () => {
    const element = panel.current;
    if (element === null) return;
    element.classList.remove('mm-drawer-dragging');
    element.classList.add('mm-drawer-settling');
    element.style.transform = 'translate3d(0, 0, 0)';
    let rested = false;
    const rest = () => {
      if (rested) return;
      rested = true;
      element.removeEventListener('transitionend', onEnd);
      element.classList.remove('mm-drawer-settling');
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
    if (from.dragging !== true) return;
    const dragged = Math.max(0, from.fromX - event.clientX);
    const speed = (from.x - event.clientX) / Math.max(1, event.timeStamp - from.lastAt);
    const width = event.currentTarget.getBoundingClientRect().width;
    const through = (width > 0 && dragged >= width * dismissAtShare) || (dragged >= flickAtPx && speed >= flickPxPerMs);
    if (through) leave();
    else settle();
  };

  return (
    <div
      ref={scrim}
      className="mm-scrim mm-scrim-drawer"
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
        className="mm-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) arrived();
        }}
        onPointerDown={(event) => {
          if (leaving.current) return;
          drag.current = { fromX: event.clientX, fromY: event.clientY, dragging: undefined, x: event.clientX, lastAt: event.timeStamp };
        }}
        onPointerMove={(event) => {
          const from = drag.current;
          if (from === undefined) return;
          if (from.dragging === undefined) {
            const dx = event.clientX - from.fromX;
            const dy = event.clientY - from.fromY;
            if (Math.abs(dx) < decideAtPx && Math.abs(dy) < decideAtPx) return;
            // Mostly up or down is a scroll of the content; mostly sideways drags the drawer, and the pointer is kept
            // so a row under the finger is not also pressed when it is let go.
            from.dragging = Math.abs(dx) > Math.abs(dy);
            if (!from.dragging) return;
            arrived();
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }
          if (!from.dragging) return;
          from.x = event.clientX;
          from.lastAt = event.timeStamp;
          follow(Math.min(0, event.clientX - from.fromX));
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {children}
      </div>
    </div>
  );
}
