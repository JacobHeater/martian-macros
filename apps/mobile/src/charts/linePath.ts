/**
 * The SVG path through `points` in order. An undefined point breaks the
 * line: what comes after it starts afresh, so a day with no record is a gap
 * and never a drop to zero.
 */
export function linePath(points: readonly (readonly [x: number, y: number] | undefined)[]): string {
  let path = '';
  let drawing = false;
  for (const point of points) {
    if (point === undefined) {
      drawing = false;
      continue;
    }
    path += `${drawing ? 'L' : 'M'}${round(point[0])} ${round(point[1])}`;
    drawing = true;
  }
  return path;
}

const round = (value: number) => Math.round(value * 100) / 100;
