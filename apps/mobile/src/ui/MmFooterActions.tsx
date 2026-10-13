import type { ReactNode } from 'react';
import './ui.css';

/**
 * The actions of a whole screen, kept in view under its scrolling content
 * and clear of the phone's gesture bar. Given to `Screen` as its footer.
 * It sits after the content, never over it, so nothing in the content can
 * be hidden behind it.
 */
export function MmFooterActions({ children }: { children: ReactNode }) {
  return (
    <div className="mm-footer-actions" role="group" aria-label="Actions">
      {children}
    </div>
  );
}
