/**
 * A screen that throws when drawn (MM-679), for the story and the test of
 * the crash notice; never shipped. `throws` says whether it still does on a
 * draw: the test flips it before pressing Try again, so the draw after goes
 * through. (React draws a crashed tree once more before the boundary takes
 * it, so a count of draws would not do.)
 */
export function CrashOnDraw({ throws = () => true }: { throws?: () => boolean } = {}): null {
  if (throws()) throw new Error('crashOnDraw: thrown on purpose while drawing');
  return null;
}
