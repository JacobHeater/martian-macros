/**
 * How "What your data says" opens while the under-eating finding holds
 * (MM-610, MM-114): it points to the notice, which comes first, and says
 * that nothing here asks for less.
 */
export function underEatingPointerText(noticeShown: boolean): string {
  return noticeShown
    ? 'Start with “About your logged days” at the top: it comes before anything here, and nothing here asks you to eat less.'
    : 'Your logged days have been under your calorie floor, so nothing here asks you to eat less.';
}
