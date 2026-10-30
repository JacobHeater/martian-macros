import type { ReactNode } from 'react';
import './ui.css';

/** A run of the drawer's rows (MM-704); a hairline stands between one group and the next. */
export function MmDrawerGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mm-drawer-group" role="group" aria-label={label}>
      {children}
    </div>
  );
}
