import { whatToExpectClosing } from '../format/whatToExpectClosing';

interface WhatToExpectPointsProps {
  points: readonly string[];
}

/** The points of "What to expect" (MM-158), as a short list, and the one closing line. */
export function WhatToExpectPoints({ points }: WhatToExpectPointsProps) {
  return (
    <>
      <ul className="onboarding-expect">
        {points.map((point) => (
          <li key={point} className="app-text">
            {point}
          </li>
        ))}
      </ul>
      <p className="app-caption">{whatToExpectClosing}</p>
    </>
  );
}
