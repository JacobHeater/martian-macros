import type { ReactNode } from 'react';
import './ui.css';

interface MmHeroSurfaceProps {
  children: ReactNode;
  onPress?: (() => void) | undefined;
  label?: string | undefined;
}

/**
 * The one hero surface of a screen: a grouping surface with limb glow and
 * orbit hairlines behind its content. At most one per screen.
 */
export function MmHeroSurface({ children, onPress, label }: MmHeroSurfaceProps) {
  const backdrop = <span className="mm-hero-backdrop" aria-hidden="true" />;
  if (onPress === undefined) {
    return (
      <section className="mm-hero">
        {backdrop}
        <div className="mm-hero-content">{children}</div>
      </section>
    );
  }
  return (
    <button type="button" className="mm-hero mm-surface-button" aria-label={label} onClick={onPress}>
      {backdrop}
      <div className="mm-hero-content">{children}</div>
    </button>
  );
}
