import type { ReactNode } from 'react';
import './ui.css';

/** Always identifies synthetic data, including outside the home screen. */
export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mm-demo">
      <p className="mm-demo-banner">DEMO · Synthetic data</p>
      <div className="mm-demo-body">{children}</div>
    </div>
  );
}
