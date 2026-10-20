import { createContext } from 'react';
import type { MmFolds } from './MmFolds';

/** The remembered folds the app provides (MM-286); undefined where a component is drawn on its own. */
export const MmFoldsContext = createContext<MmFolds | undefined>(undefined);
