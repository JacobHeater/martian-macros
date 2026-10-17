import { useContext } from 'react';
import type { InsightPreview } from './InsightPreview';
import { InsightPreviewContext } from './InsightPreviewContext';

/** The inline insights, grades and Coach settings to draw; nothing in the app until MM-362 and MM-370 are built. */
export function useInsightPreview(): InsightPreview {
  return useContext(InsightPreviewContext);
}
