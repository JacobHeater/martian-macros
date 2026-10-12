import { createContext } from 'react';

/** How a pushed screen leaves; absent on the screens at the bottom. */
export const CloseScreenContext = createContext<(() => void) | undefined>(undefined);
