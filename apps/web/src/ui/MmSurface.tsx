import type { ReactNode } from 'react';
import './ui.css';

/** The plain grouped surface content sits on. */
export function MmSurface({ children }: { children: ReactNode }) {
  return <section className="mm-surface">{children}</section>;
}
