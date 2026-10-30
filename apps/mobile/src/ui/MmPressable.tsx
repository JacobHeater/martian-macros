import { useRef, type ReactNode } from 'react';
import type { MmAnchor } from './MmAnchor';
import './ui.css';

/** How long a finger holds still before the hold counts (MM-661), and how far it may drift meanwhile. */
const holdMs = 500;
const holdSlopPx = 8;

interface MmPressableProps {
  /** What pressing does, said aloud when the content does not say it. */
  label?: string | undefined;
  /** For content that opens and closes something: whether it is open, and the id of what it controls. */
  expanded?: boolean | undefined;
  controls?: string | undefined;
  /** The ids of what says more about it, read after its name. */
  describedBy?: string | undefined;
  /** Whether it stands for the place the person is at now, as the bar's current destination does (MM-704). */
  current?: boolean | undefined;
  /** Given the pressed content's edges, for what opens beside it (MM-562). */
  onPress: (anchor: MmAnchor) => void;
  /** Takes focus when it first draws: where focus goes back to after something it stood for was replaced (MM-634). */
  autoFocus?: boolean | undefined;
  /**
   * What a long press does (MM-661): the finger held still for half a second, given the content's edges as
   * `onPress` is. The press that follows the hold is not also a press. A finger that drifts, as a swipe
   * begins, is not holding.
   */
  onLongPress?: ((anchor: MmAnchor) => void) | undefined;
  children: ReactNode;
}

/**
 * Content that can be pressed as a whole: a hero that opens the day, an
 * entry that opens its editor, a heading that folds its list. It draws
 * nothing of its own, so the content keeps its look, and it is the one way
 * a screen makes a region pressable without a raw button (MM-246).
 */
export function MmPressable({ label, expanded, controls, describedBy, current, onPress, children, autoFocus = false, onLongPress }: MmPressableProps) {
  const hold = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | undefined>(undefined);
  const held = useRef(false);
  const letGo = () => {
    if (hold.current !== undefined) clearTimeout(hold.current.timer);
    hold.current = undefined;
  };
  const holds = onLongPress !== undefined;
  return (
    <button
      type="button"
      className={`mm-pressable${holds ? ' mm-pressable-holds' : ''}`}
      aria-label={label}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-describedby={describedBy}
      aria-current={current === true ? 'page' : undefined}
      autoFocus={autoFocus}
      onPointerDown={
        !holds
          ? undefined
          : (event) => {
              letGo();
              held.current = false;
              const pressed = event.currentTarget;
              const timer = setTimeout(() => {
                hold.current = undefined;
                held.current = true;
                onLongPress(pressed.getBoundingClientRect());
              }, holdMs);
              hold.current = { timer, x: event.clientX, y: event.clientY };
            }
      }
      onPointerMove={
        !holds
          ? undefined
          : (event) => {
              const start = hold.current;
              if (start !== undefined && Math.hypot(event.clientX - start.x, event.clientY - start.y) > holdSlopPx) letGo();
            }
      }
      onPointerUp={holds ? letGo : undefined}
      onPointerCancel={holds ? letGo : undefined}
      onPointerLeave={holds ? letGo : undefined}
      // The phone's own long-press menu never shows over a hold that means something here.
      onContextMenu={holds ? (event) => event.preventDefault() : undefined}
      onClick={(event) => {
        if (held.current) {
          held.current = false;
          return;
        }
        onPress(event.currentTarget.getBoundingClientRect());
      }}
    >
      {children}
    </button>
  );
}
