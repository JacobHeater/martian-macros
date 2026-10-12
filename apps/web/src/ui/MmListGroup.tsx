import type { ReactNode } from 'react';
import './ui.css';

/** Rows that belong together, on one surface with hairlines between them. */
export function MmListGroup({ children }: { children: ReactNode }) {
  return <div className="mm-list-group">{children}</div>;
}
