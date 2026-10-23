import type { ReactNode } from 'react';
import { MartianRidge } from '../ui/MartianRidge';
import { MmAppBar } from '../ui/MmAppBar';
import { BackButton } from './BackButton';
import './app.css';

interface ScreenProps {
  /** The screen's name, in its top bar. Without one there is no bar (onboarding, welcome back). */
  title?: string | undefined;
  actions?: ReactNode;
  /** Wider padding, for the screens that are one column of reading. */
  roomy?: boolean;
  /** Shown under the scrolling content, always in view. */
  footer?: ReactNode;
  children: ReactNode;
}

/** A whole screen: an optional top bar, content that scrolls, and an optional footer. */
export function Screen({ title, actions, roomy = false, footer, children }: ScreenProps) {
  return (
    <div className="app-frame">
      {title === undefined ? null : <MmAppBar title={title} leading={<BackButton />} actions={actions} />}
      <main className={`app-body${roomy ? ' app-body-roomy' : ''}${title === undefined ? ' app-body-barless' : ''}`}>
        {children}
        <MartianRidge />
      </main>
      {footer}
    </div>
  );
}
