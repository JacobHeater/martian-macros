import type { ReactNode } from 'react';
import { InlineInsight } from './InlineInsight';
import type { InlineInsightContent } from './InlineInsightContent';

interface RowWithInsightProps {
  /** Every line about the row, the higher priority first (MM-393). */
  insights: readonly InlineInsightContent[];
  children: ReactNode;
}

/**
 * A list row and the coach's lines under it, if any (MM-362),
 * as one child of its list group, so the group's hairline falls above the
 * pair and never between a row and what is said about it.
 */
export function RowWithInsight({ insights, children }: RowWithInsightProps) {
  if (insights.length === 0) return <>{children}</>;
  return (
    <div>
      {children}
      {insights.map((insight) => (
        <InlineInsight key={insight.rule} insight={insight} layout="row" />
      ))}
    </div>
  );
}
