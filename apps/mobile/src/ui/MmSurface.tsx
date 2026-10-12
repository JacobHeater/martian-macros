import type { ReactNode } from 'react';
import type { MmSurfaceKind } from './MmSurfaceKind';
import './ui.css';

interface MmSurfaceProps {
  children: ReactNode;
  /** Inset the content by the standard card padding. */
  padded?: boolean;
  /** Makes the whole surface a button (a summary that opens its detail). */
  onPress?: (() => void) | undefined;
  /** What a person hears for a surface that is a button. */
  label?: string | undefined;
  kind?: MmSurfaceKind;
}

/** A grouping surface: one card for one idea. */
export function MmSurface({ children, padded = true, onPress, label, kind = 'standard' }: MmSurfaceProps) {
  const className = `mm-surface mm-surface-${kind}${padded ? '' : ' mm-surface-flush'}`;
  if (onPress === undefined) return <section className={className}>{children}</section>;
  return (
    <button type="button" className={`${className} mm-surface-button`} aria-label={label} onClick={onPress}>
      {children}
    </button>
  );
}
