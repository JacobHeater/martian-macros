import type { ReactNode } from 'react';
import { MmSurface } from './MmSurface';
import './ui.css';

interface InfoCardProps {
  title: string;
  children: ReactNode;
  trailing?: ReactNode;
  /** Makes the card open its detail screen when pressed. */
  onPress?: (() => void) | undefined;
}

/** A titled card section used across the main screens. */
export function InfoCard({ title, children, trailing, onPress }: InfoCardProps) {
  return (
    <MmSurface onPress={onPress}>
      <div className="mm-info-card-head">
        <h2 className="mm-info-card-title">{title}</h2>
        {trailing}
      </div>
      {children}
    </MmSurface>
  );
}
