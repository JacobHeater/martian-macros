import type { ReactNode } from 'react';
import { MmPressable } from './MmPressable';
import type { MmSurfaceKind } from './MmSurfaceKind';
import './ui.css';

interface MmSurfaceProps {
  children: ReactNode;
  /** Inset the content by the standard card padding. */
  padded?: boolean;
  /** Makes the whole surface pressable (a summary that opens its detail). */
  onPress?: (() => void) | undefined;
  /** What a person hears for a surface that is pressed. */
  label?: string | undefined;
  kind?: MmSurfaceKind;
}

/** A grouping surface: one card for one idea. Pressable, it composes `MmPressable` (MM-278). */
export function MmSurface({ children, padded = true, onPress, label, kind = 'standard' }: MmSurfaceProps) {
  const className = `mm-surface mm-surface-${kind}${padded ? '' : ' mm-surface-flush'}`;
  if (onPress === undefined) return <section className={className}>{children}</section>;
  return (
    <MmPressable label={label} onPress={onPress}>
      <span className={className}>{children}</span>
    </MmPressable>
  );
}
