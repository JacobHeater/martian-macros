import { createContext } from 'react';
import type { InlineNarration } from './InlineNarration';

/** The day's inline lines in the model's words (MM-687), where a screen provides them; undefined elsewhere. */
export const InlineNarrationContext = createContext<InlineNarration | undefined>(undefined);
