const values = ['safety', 'dataQuality', 'coaching', 'pattern', 'education'] as const;

/** The order insights compete in, highest first (MM-141). */
export type InsightPriority = (typeof values)[number];

export const InsightPriority = {
  values,

  /** The place of a priority in the order: 0 is highest. */
  index(priority: InsightPriority): number {
    return values.indexOf(priority);
  },
} as const;
