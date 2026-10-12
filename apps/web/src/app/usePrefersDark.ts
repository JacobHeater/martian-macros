import { useEffect, useState } from 'react';

const QUERY = '(prefers-color-scheme: dark)';

/** Whether the phone is set to a dark appearance, kept current. */
export function usePrefersDark(): boolean {
  const [prefersDark, setPrefersDark] = useState(() => window.matchMedia(QUERY).matches);
  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const changed = () => setPrefersDark(media.matches);
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  return prefersDark;
}
