// Storybook's manager bundle compiles JSX with the classic runtime, which needs React in scope.
import React from 'react';
import { STORY_CHANGED } from 'storybook/internal/core-events';
import { AddonPanel } from 'storybook/internal/components';
import { addons, types, useChannel } from 'storybook/manager-api';
import type { StoryFact } from '../src/gallery/screens/StoryFact';
import { storyFactsEvent } from '../src/gallery/screens/storyFactsEvent';

/**
 * "Person": who a screen story's person is, read from what its scenario
 * stored (MM-356), so a difference between two stories, such as no water
 * goal, is seen beside the story and never only in its code.
 */
function PersonPanel({ active }: { active: boolean }) {
  const [facts, setFacts] = React.useState<readonly StoryFact[]>();
  useChannel({
    [storyFactsEvent]: (told: readonly StoryFact[]) => setFacts(told),
    [STORY_CHANGED]: () => setFacts(undefined),
  });
  return (
    <AddonPanel active={active}>
      {facts === undefined ? (
        <p style={{ padding: 16, margin: 0 }}>Not a screen story: no person is drawn.</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', margin: 16 }}>
          <tbody>
            {facts.map(([label, value]) => (
              <tr key={label}>
                <th style={{ textAlign: 'left', padding: '4px 16px 4px 0', fontWeight: 600, verticalAlign: 'top' }}>{label}</th>
                <td style={{ padding: '4px 0' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AddonPanel>
  );
}

addons.register('mm/person', () => {
  addons.add('mm/person/panel', {
    type: types.PANEL,
    title: 'Person',
    render: ({ active }) => <PersonPanel active={active === true} />,
  });
});
