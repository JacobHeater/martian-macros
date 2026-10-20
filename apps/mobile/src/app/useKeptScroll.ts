import { type RefObject, useLayoutEffect } from 'react';
import type { HomeDestination } from '../state/HomeDestination';
import type { ValueCell } from '../state/ValueCell';

/**
 * A destination's scroll position survives a visit elsewhere (MM-286): on
 * arriving, the body is put back where it was left, as soon as its content
 * is tall enough to be, and left alone once the person scrolls or something
 * on the screen brings itself into view. Where the person had scrolled is
 * kept whenever the destination changes, however it changed (a row, a snack,
 * the bar; the panel's PD7); `leave` is kept for callers that know first.
 */
export function useKeptScroll(
  body: RefObject<HTMLElement | null>,
  current: HomeDestination,
  kept: ValueCell<ReadonlyMap<HomeDestination, number>>,
): { leave: (destination: HomeDestination) => void } {
  useLayoutEffect(() => {
    const element = body.current;
    if (element === null) return undefined;
    const target = kept.peek().get(current) ?? 0;
    // The last place the body was seen at, kept when this destination is left whichever way it was left.
    let last: number | undefined;
    const seen = () => {
      last = element.scrollTop;
    };
    element.addEventListener('scroll', seen);
    let pending = true;
    let observer: ResizeObserver | undefined;
    /** Where the body was last put, so its own scroll event is told from the person's. */
    let placed = 0;
    const settle = () => {
      pending = false;
      observer?.disconnect();
      element.removeEventListener('scroll', moved);
    };
    const moved = () => {
      if (element.scrollTop !== placed) settle();
    };
    const apply = () => {
      if (!pending) return;
      element.scrollTop = target;
      placed = element.scrollTop;
      // Reached, or the body is as tall as it will be for now: nothing further to wait for.
      if (element.scrollHeight - element.clientHeight >= target) settle();
    };
    apply();
    if (pending) {
      // The content arrives as its records are read, so the position is tried again as the body grows.
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(apply);
        for (const child of element.children) observer.observe(child);
      }
      // A scroll of the person's own, or a section brought into view, is where it stays.
      element.addEventListener('scroll', moved);
    }
    return () => {
      observer?.disconnect();
      element.removeEventListener('scroll', moved);
      element.removeEventListener('scroll', seen);
      if (last !== undefined) kept.put(new Map(kept.peek()).set(current, last));
    };
  }, [body, current, kept]);
  return {
    leave: (destination) => {
      const element = body.current;
      if (element !== null) kept.put(new Map(kept.peek()).set(destination, element.scrollTop));
    },
  };
}
