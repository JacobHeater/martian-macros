import { type MouseEvent, type PointerEvent, type RefObject, useRef } from 'react';
import type { EdgeSide } from './EdgeSide';

/** How far in from a side a swipe may start. */
const edgePx = 24;
/** Movement shorter than this says nothing yet about where the finger is going. */
const slopPx = 10;
/** Let go past this share of the width and the swipe goes through. */
const throughAtShare = 1 / 3;
/** Or let go past this distance, moving at least this fast. */
const flickAtPx = 48;
const flickPxPerMs = 0.5;
/** How long a spring back may take before what moved is let be. */
const settleMs = 400;
/** What drags sideways itself keeps its drag, even at the edge. */
const dragsSideways = 'input, textarea, [data-drags-sideways]';

interface Swipe {
  readonly side: EdgeSide;
  readonly x: number;
  readonly y: number;
  readonly at: number;
  following: boolean;
}

/**
 * A swipe in from a side of the screen (MM-578). While it moves, `target`
 * follows the finger (`data-edge-swipe` and `--mm-edge-swipe`). Let go far
 * or fast enough and `onSwipe` is told the side it came from; otherwise
 * `target` springs back. A side `canSwipeFrom` refuses never starts. The
 * handlers go on the element that takes the touches.
 */
export function useEdgeSwipe(
  target: RefObject<HTMLElement | null>,
  canSwipeFrom: (side: EdgeSide) => boolean,
  onSwipe: (side: EdgeSide) => void,
) {
  const swipe = useRef<Swipe | undefined>(undefined);
  const swallowClick = useRef(false);

  const inward = (from: Swipe, x: number) => Math.max(0, from.side === 'left' ? x - from.x : from.x - x);

  const follow = (from: Swipe, distance: number) => {
    const element = target.current;
    if (element === null) return;
    element.dataset.edgeSwipe = 'moving';
    element.style.setProperty('--mm-edge-swipe', `${from.side === 'left' ? distance : -distance}px`);
  };

  const letGo = (springBack: boolean) => {
    const element = target.current;
    if (element === null) return;
    element.style.removeProperty('--mm-edge-swipe');
    if (!springBack) {
      delete element.dataset.edgeSwipe;
      return;
    }
    element.dataset.edgeSwipe = 'settling';
    setTimeout(() => {
      if (element.dataset.edgeSwipe === 'settling') delete element.dataset.edgeSwipe;
    }, settleMs);
  };

  return {
    onPointerDownCapture(event: PointerEvent<HTMLElement>) {
      swipe.current = undefined;
      swallowClick.current = false;
      if (event.pointerType === 'mouse') return;
      const x = event.clientX;
      const side: EdgeSide | undefined = x <= edgePx ? 'left' : x >= window.innerWidth - edgePx ? 'right' : undefined;
      if (side === undefined || !canSwipeFrom(side)) return;
      if (event.target instanceof Element && event.target.closest(dragsSideways) !== null) return;
      swipe.current = { side, x, y: event.clientY, at: event.timeStamp, following: false };
    },
    onPointerMoveCapture(event: PointerEvent<HTMLElement>) {
      const from = swipe.current;
      if (from === undefined) return;
      const across = from.side === 'left' ? event.clientX - from.x : from.x - event.clientX;
      if (!from.following) {
        const down = Math.abs(event.clientY - from.y);
        if (Math.max(Math.abs(across), down) < slopPx) return;
        // Mostly up or down, or back out: a scroll, not a swipe.
        if (down >= across) {
          swipe.current = undefined;
          return;
        }
        from.following = true;
      }
      // What is under the finger does not also take the swipe as its own drag.
      event.stopPropagation();
      follow(from, inward(from, event.clientX));
    },
    onPointerUpCapture(event: PointerEvent<HTMLElement>) {
      const from = swipe.current;
      swipe.current = undefined;
      if (from === undefined || !from.following) return;
      event.stopPropagation();
      swallowClick.current = true;
      const distance = inward(from, event.clientX);
      const fast = distance / Math.max(1, event.timeStamp - from.at) >= flickPxPerMs;
      const through = distance >= window.innerWidth * throughAtShare || (distance >= flickAtPx && fast);
      letGo(!through);
      if (through) onSwipe(from.side);
    },
    onPointerCancelCapture() {
      const from = swipe.current;
      swipe.current = undefined;
      if (from?.following === true) letGo(true);
    },
    // A swipe is not also a press of what it started on.
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      event.stopPropagation();
      event.preventDefault();
    },
  };
}
