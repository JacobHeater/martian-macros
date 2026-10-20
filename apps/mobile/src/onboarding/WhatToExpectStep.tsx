import { MmSwitchRow } from '../ui/MmSwitchRow';
import { WhatToExpectPoints } from './WhatToExpectPoints';

interface WhatToExpectStepProps {
  points: readonly string[];
  /** The weigh-in reminder, offered here once (MM-146). */
  remind: boolean;
  onRemind: (on: boolean) => void;
}

/** Step 8: what the first month will actually look like (MM-158), and the weigh-in reminder offered once. */
export function WhatToExpectStep({ points, remind, onRemind }: WhatToExpectStepProps) {
  return (
    <>
      <h1 className="app-headline">What to expect</h1>
      <div className="app-gap-small" />
      <WhatToExpectPoints points={points} />
      <div className="app-gap-small" />
      <MmSwitchRow
        leadingIcon="bell"
        title="Remind me to weigh in"
        subtitle="Each morning, first thing. You can change the time or turn it off in Settings."
        value={remind}
        onChange={onRemind}
      />
    </>
  );
}
