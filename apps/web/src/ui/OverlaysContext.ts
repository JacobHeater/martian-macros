import { createContext } from 'react';
import type { Overlays } from './Overlays';

export const OverlaysContext = createContext<Overlays | undefined>(undefined);
