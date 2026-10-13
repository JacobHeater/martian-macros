import { createContext } from 'react';
import type { AppScope } from './AppScope';

export const AppContext = createContext<AppScope | undefined>(undefined);
