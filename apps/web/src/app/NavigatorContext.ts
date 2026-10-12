import { createContext } from 'react';
import type { Navigator } from './Navigator';

export const NavigatorContext = createContext<Navigator | undefined>(undefined);
