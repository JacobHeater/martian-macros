import { type ReactNode, useRef, useState } from 'react';
import { MmIcon } from './MmIcon';
import './ui.css';

/** How far left a row is dragged before letting go removes it. */
const removeAtPx = 120;
/** A drag shorter than this is a press. */
const pressSlopPx = 8;

interface MmSwipeToRemoveProps {
  children: ReactNode;
  onRemove: () => void;
}

/**
 * A row that is removed by dragging it to the left. An accelerator only:
 * whatever shows it also offers the removal as a visible action.
 */
export function MmSwipeToRemove({ children, onRemove }: MmSwipeToRemoveProps) {
  const from = useRef<number | undefined>(undefined);
  const dragged = useRef(false);
  const [offset, setOffset] = useState(0);

  const end = (remove: boolean) => {
    if (from.current === undefined) return;
    from.current = undefined;
    setOffset(0);
    if (remove) onRemove();
  };

  return (
    <div
      className={`mm-swipe${offset === 0 ? '' : ' mm-swipe-moving'}`}
      // Its own sideways drag wins over a swipe in from the side (MM-582).
      data-drags-sideways=""
      onPointerDown={(event) => {
        from.current = event.clientX;
        dragged.current = false;
      }}
      onPointerMove={(event) => {
        if (from.current === undefined) return;
        const moved = Math.min(0, event.clientX - from.current);
        if (moved < -pressSlopPx) dragged.current = true;
        setOffset(moved);
      }}
      onPointerUp={(event) => end(from.current !== undefined && event.clientX - from.current <= -removeAtPx)}
      onPointerCancel={() => end(false)}
      onPointerLeave={() => end(false)}
      // A drag is not also a press of what was dragged.
      onClickCapture={(event) => {
        if (!dragged.current) return;
        dragged.current = false;
        event.stopPropagation();
        event.preventDefault();
      }}
    >
      <span className="mm-swipe-behind" aria-hidden="true">
        <MmIcon name="delete" />
      </span>
      <div className="mm-swipe-row" style={offset === 0 ? undefined : { transform: `translateX(${offset}px)` }}>
        {children}
      </div>
    </div>
  );
}
