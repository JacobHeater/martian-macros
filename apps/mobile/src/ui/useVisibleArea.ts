import { useEffect, useState } from 'react';

/** How much of the screen's layout is out of sight, above and below, in px. */
interface Hidden {
  readonly top: number;
  readonly bottom: number;
}

const none: Hidden = { top: 0, bottom: 0 };

/**
 * What of the layout the on-screen keyboard hides (MM-566): the space under
 * the visible area, and over it when the view was scrolled to keep the field
 * in sight. Where the shell resizes the page for the keyboard, nothing is
 * hidden and both are 0.
 */
export function useVisibleArea(): Hidden {
  const [hidden, setHidden] = useState<Hidden>(none);
  useEffect(() => {
    const view = window.visualViewport;
    if (view === null || view === undefined) return undefined;
    const measure = () => {
      const top = Math.max(0, Math.round(view.offsetTop));
      const bottom = Math.max(0, Math.round(window.innerHeight - view.height - view.offsetTop));
      setHidden((was) => (was.top === top && was.bottom === bottom ? was : { top, bottom }));
    };
    measure();
    view.addEventListener('resize', measure);
    view.addEventListener('scroll', measure);
    return () => {
      view.removeEventListener('resize', measure);
      view.removeEventListener('scroll', measure);
    };
  }, []);
  return hidden;
}
