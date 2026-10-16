import type { CSSProperties } from 'react';

/** What `MmIcon` gives a glyph: its class, its size, and that it is decorative. */
export interface MmIconProps {
  className?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean;
  focusable?: 'false';
}
