/**
 * Which row an inline insight sits under, so its icon and words line up
 * with that row's own (MM-362): a food entry (`entry`), a list row with a
 * leading icon (`row`), or a list row without one (`plain`).
 */
export type InlineInsightLayout = 'entry' | 'row' | 'plain';
