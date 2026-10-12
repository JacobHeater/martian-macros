import { useEffect, useState } from 'react';
import { useApp } from '../app/useApp';

/**
 * The app's time, read again once a second, for a running timer (MM-191).
 * It comes from the app's clock, so a test can fix it.
 */
export function useNow(): Date {
  const { services } = useApp();
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  return services.clock.now();
}
