import { type PointerEvent, type RefObject, useEffect, useRef, useState } from 'react';
import type { PullState } from './PullState';

/** Movement shorter than this says nothing yet about where the finger is going. */
const slopPx = 10;
/** Let go drawn down this far and the refresh goes through. */
const throughAtPx = 72;
/** Where the body rests while the refresh runs. */
const restingPx = 56;
/** The finger moves twice as far as the body, and the body stops here. */
const resistance = 0.5;
const furthestPx = 120;
/** A refresh shows at least this long, so a fast one is still seen to happen. */
const shownForMs = 500;

interface Pull {
  readonly x: number;
  readonly y: number;
  following: boolean;
}

/**
 * A pull down from the top of `target`, a scrolling body (MM-670). While the
 * finger draws it down `state` follows, past `throughAtPx` it is ready, and
 * let go there `onRefresh` runs while the body rests drawn down; let go
 * sooner it springs back. With no `onRefresh` nothing starts. The handlers
 * go on `target`; a touch that pulls is kept from scrolling or bouncing it.
 */
export function usePullToRefresh(target: RefObject<HTMLElement | null>, onRefresh: (() => Promise<unknown>) | undefined) {
  const [state, setState] = useState<PullState>({ phase: 'idle', distance: 0 });
  const pull = useRef<Pull | undefined>(undefined);
  const refreshing = useRef(false);
  const enabled = useRef(onRefresh !== undefined);
  enabled.current = onRefresh !== undefined;

  // The browser decides on its first touchmove whether it scrolls: a passive listener cannot say no, and once it
  // scrolls (or bounces, at the top) the pointer events are cancelled. So a downward touch at the top is refused it.
  useEffect(() => {
    const element = target.current;
    if (element === null) return;
    let fromY: number | undefined;
    const begin = (event: TouchEvent) => {
      fromY = event.touches.length === 1 ? event.touches[0]?.clientY : undefined;
    };
    const keep = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (!enabled.current || fromY === undefined || y === undefined || element.scrollTop > 0) return;
      if (y > fromY && event.cancelable) event.preventDefault();
    };
    element.addEventListener('touchstart', begin, { passive: true });
    element.addEventListener('touchmove', keep, { passive: false });
    return () => {
      element.removeEventListener('touchstart', begin);
      element.removeEventListener('touchmove', keep);
    };
  }, [target]);

  const distanceOf = (from: Pull, y: number) => Math.min(furthestPx, Math.max(0, (y - from.y) * resistance));

  const refresh = async () => {
    if (onRefresh === undefined) return;
    refreshing.current = true;
    setState({ phase: 'refreshing', distance: restingPx });
    const shown = new Promise((resolve) => setTimeout(resolve, shownForMs));
    try {
      await onRefresh();
    } catch {
      // What could not be read says so where it is shown.
    }
    await shown;
    refreshing.current = false;
    setState({ phase: 'idle', distance: 0 });
  };

  return {
    state,
    handlers: {
      onPointerDown(event: PointerEvent<HTMLElement>) {
        pull.current = undefined;
        if (onRefresh === undefined || refreshing.current || event.pointerType === 'mouse') return;
        const element = target.current;
        if (element === null || element.scrollTop > 0) return;
        pull.current = { x: event.clientX, y: event.clientY, following: false };
      },
      onPointerMove(event: PointerEvent<HTMLElement>) {
        const from = pull.current;
        if (from === undefined) return;
        if (!from.following) {
          const down = event.clientY - from.y;
          const across = Math.abs(event.clientX - from.x);
          if (Math.max(Math.abs(down), across) < slopPx) return;
          // Up, or mostly sideways: a scroll or a swipe, not a pull.
          if (down <= across) {
            pull.current = undefined;
            return;
          }
          from.following = true;
        }
        const distance = distanceOf(from, event.clientY);
        setState({ phase: distance >= throughAtPx ? 'ready' : 'pulling', distance });
      },
      onPointerUp(event: PointerEvent<HTMLElement>) {
        const from = pull.current;
        pull.current = undefined;
        if (from === undefined || !from.following) return;
        if (distanceOf(from, event.clientY) >= throughAtPx) void refresh();
        else setState({ phase: 'idle', distance: 0 });
      },
      onPointerCancel() {
        const from = pull.current;
        pull.current = undefined;
        if (from?.following === true) setState({ phase: 'idle', distance: 0 });
      },
    },
  };
}
