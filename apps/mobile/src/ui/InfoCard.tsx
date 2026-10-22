import type { ReactNode } from 'react';
import { MmSurface } from './MmSurface';
import './ui.css';

interface InfoCardProps {
  title: string;
  children: ReactNode;
  trailing?: ReactNode;
  /** Makes the card open its detail screen when pressed. */
  onPress?: (() => void) | undefined;
  /** An id for the title, which can then take focus: for a card whose title changed at the reader's hand (MM-490). */
  titleId?: string | undefined;
}

/** A titled card section used across the main screens. */
export function InfoCard({ title, children, trailing, onPress, titleId }: InfoCardProps) {
  return (
    <MmSurface onPress={onPress}>
      <div className="mm-info-card-head">
        <h2 className="mm-info-card-title" id={titleId} tabIndex={titleId === undefined ? undefined : -1}>
          {title}
        </h2>
        {trailing}
      </div>
      {children}
    </MmSurface>
  );
}
