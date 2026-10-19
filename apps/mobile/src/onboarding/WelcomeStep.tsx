import { useEffect, useState } from 'react';
import { HorizonArc } from '../ui/HorizonArc';
import { MmButton } from '../ui/MmButton';

const settledAt = 0.62;
const drawMs = 600;

/** Where the body on the arc is `elapsed` milliseconds in: easing out, as it slows into place. */
function arcAt(elapsedMs: number): number {
  const t = Math.min(1, elapsedMs / drawMs);
  return settledAt * (1 - (1 - t) ** 3);
}

/** The first screen: what the app is, the horizon arc drawn once, and a way in. */
export function WelcomeStep({ onStart }: { onStart: () => void }) {
  const still =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [progress, setProgress] = useState(still ? settledAt : 0);

  useEffect(() => {
    if (still || typeof requestAnimationFrame !== 'function') {
      setProgress(settledAt);
      return undefined;
    }
    let frame = 0;
    let started: number | undefined;
    const draw = (now: number) => {
      started ??= now;
      setProgress(arcAt(now - started));
      if (now - started < drawMs) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [still]);

  return (
    <div className="onboarding-welcome">
      <div className="onboarding-welcome-top" />
      <h1 className="app-figure">Martian Macros</h1>
      <p className="app-lead">Coaching for fat loss and muscle gain that adapts to your body, not a formula.</p>
      <div className="app-gap-large" />
      <HorizonArc progress={progress} />
      <div className="app-gap" />
      <p className="app-text app-muted">
        A few questions first. It takes about two minutes, and everything stays on this phone.
      </p>
      <div className="onboarding-welcome-bottom" />
      <div className="app-row app-row-end">
        <MmButton label="Begin" onPress={onStart} />
      </div>
    </div>
  );
}
