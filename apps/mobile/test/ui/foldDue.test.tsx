import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import type { MmFolds } from '../../src/ui/MmFolds';
import { MmFoldsContext } from '../../src/ui/MmFoldsContext';
import { MmSection } from '../../src/ui/MmSection';

/**
 * The WS-03 panel's F4: a fold the app opens because something fell due beats
 * a fold the person closed earlier. The Coach's recovery section names its
 * fold by how many check-ins are due, so a new one opens it again.
 */
function folds(): MmFolds {
  const kept = new Map<string, boolean>();
  return { get: (key) => kept.get(key), set: (key, open) => void kept.set(key, open) };
}

function Recovery({ timesDue }: { timesDue: number }) {
  return (
    <MmSection key={timesDue} icon="heart" title="How you are holding up" collapsible initiallyExpanded remember={`coach.recovery.${timesDue}`}>
      <p>The check-in</p>
    </MmSection>
  );
}

it('a recovery section folded once opens again when the next check-in falls due', async () => {
  const kept = folds();
  const { rerender } = render(
    <MmFoldsContext.Provider value={kept}>
      <Recovery timesDue={1} />
    </MmFoldsContext.Provider>,
  );
  expect(screen.getByText('The check-in')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /^How you are holding up/ }));
  expect(screen.queryByText('The check-in')).toBeNull();
  rerender(
    <MmFoldsContext.Provider value={kept}>
      <Recovery timesDue={1} />
    </MmFoldsContext.Provider>,
  );
  expect(screen.queryByText('The check-in'), 'the same check-in stays as the person left it').toBeNull();
  rerender(
    <MmFoldsContext.Provider value={kept}>
      <Recovery timesDue={2} />
    </MmFoldsContext.Provider>,
  );
  expect(screen.getByText('The check-in')).toBeInTheDocument();
});
