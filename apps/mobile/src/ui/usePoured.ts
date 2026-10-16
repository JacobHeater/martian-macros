import { useEffect, useState } from 'react';

/**
 * Whether a bar that pours (MM-326) has been painted empty yet: false on its
 * first paint, true two frames later, so it fills from empty each time it
 * appears. A bar that does not pour, or any bar under reduced motion, is
 * at its level from the start (MM-327).
 */
export function usePoured(pours: boolean): boolean {
  const [poured, setPoured] = useState(
    () => !pours || (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
  );
  useEffect(() => {
    if (poured) return;
    if (typeof requestAnimationFrame !== 'function') {
      setPoured(true);
      return;
    }
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setPoured(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [poured]);
  return poured;
}
