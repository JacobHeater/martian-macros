import { createContext } from 'react';
import type { InsightPreview } from './InsightPreview';

/** Empty in the app: nothing of MM-362 to MM-370 is drawn until a design story hands it in. */
export const InsightPreviewContext = createContext<InsightPreview>({});
