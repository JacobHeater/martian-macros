import { useEffect, useRef, useState } from 'react';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';

interface OpeningFailedProps {
  /** Opens the data again; the notice says it is trying until this settles. */
  onRetry: () => Promise<void>;
}

/**
 * The data could not be opened when the app started (MM-694): said as a failed
 * read in the app's own words (MM-333), with Try again, before any theme is
 * known, so in the app's default look. Only `startApp` draws it.
 */
export function OpeningFailed({ onRetry }: OpeningFailedProps) {
  const [pending, setPending] = useState(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const retry = () => {
    setPending(true);
    void onRetry().finally(() => {
      if (mounted.current) setPending(false);
    });
  };
  return (
    <div className="app-centered app-centered-page">
      <ReadFailedNotice
        title="Could not open your data"
        otherwise="If this keeps happening, close the app and open it again."
        onRetry={retry}
        pending={pending}
      />
    </div>
  );
}
