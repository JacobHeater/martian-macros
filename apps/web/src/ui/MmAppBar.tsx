import type { ReactNode } from 'react';
import './ui.css';

interface MmAppBarProps {
  /** The screen's name: its heading, and what a person hears on arriving. */
  title: string;
  /** Shown in place of the title, which is then only said (the Food screen puts its day stepper here). */
  titleContent?: ReactNode;
  /** Shown before the title: the way back on a pushed screen. */
  leading?: ReactNode;
  /** Shown after the title: this screen's actions. */
  actions?: ReactNode;
}

/** The bar at the top of every screen, with the screen's name as its heading. */
export function MmAppBar({ title, titleContent, leading, actions }: MmAppBarProps) {
  return (
    <header className="mm-app-bar">
      {leading}
      {titleContent === undefined ? (
        <h1 className="mm-app-bar-title">{title}</h1>
      ) : (
        <div className="mm-app-bar-title">
          <h1 className="mm-visually-hidden">{title}</h1>
          {titleContent}
        </div>
      )}
      {actions}
    </header>
  );
}
