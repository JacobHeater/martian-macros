import type { ReactNode } from 'react';
import './ui.css';

interface MmAppBarProps {
  title: string;
  /** Shown before the title: the way back on a pushed screen. */
  leading?: ReactNode;
  /** Shown after the title: this screen's actions. */
  actions?: ReactNode;
}

/** The bar at the top of every screen, with the screen's name as its heading. */
export function MmAppBar({ title, leading, actions }: MmAppBarProps) {
  return (
    <header className="mm-app-bar">
      {leading}
      <h1 className="mm-app-bar-title">{title}</h1>
      {actions}
    </header>
  );
}
