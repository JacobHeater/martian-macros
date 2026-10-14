import type { ReactNode } from 'react';
import { MmPressable } from './MmPressable';
import './ui.css';

interface MmHeroSurfaceProps {
  children: ReactNode;
  onPress?: (() => void) | undefined;
  label?: string | undefined;
}

/**
 * The one hero surface of a screen: a grouping surface with limb glow and
 * orbit hairlines behind its content. At most one per screen. Pressable,
 * it composes `MmPressable` (MM-278).
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
    <MmPressable label={label} onPress={onPress}>
      <span className="mm-hero">
        {backdrop}
        <span className="mm-hero-content">{children}</span>
      </span>
    </MmPressable>
  );
}
