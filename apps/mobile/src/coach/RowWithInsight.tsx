import type { ReactNode } from 'react';
import { InlineInsight } from './InlineInsight';
import type { InlineInsightContent } from './InlineInsightContent';

interface RowWithInsightProps {
  insight: InlineInsightContent | undefined;
  children: ReactNode;
}

/**
 * A list row and, when there is one, the coach's line under it (MM-362),
 * as one child of its list group, so the group's hairline falls above the
 * pair and never between a row and what is said about it.
 */
export function RowWithInsight({ insight, children }: RowWithInsightProps) {
  if (insight === undefined) return <>{children}</>;
  return (
    <div>
      {children}
      <InlineInsight insight={insight} layout="row" />
    </div>
  );
}
