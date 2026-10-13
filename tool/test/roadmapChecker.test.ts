import assert from 'node:assert/strict';
import { test } from 'node:test';
import { roadmapProblems, type RoadmapTicketFacts } from '../src/roadmapChecker.ts';

/** MM-245: the roadmap is checked against the tickets, so it cannot drift. */
const tickets: RoadmapTicketFacts[] = [
  { id: 'MM-1', status: 'done', type: 'TASK' },
  { id: 'MM-2', status: 'proposed', type: 'STORY' },
  { id: 'MM-3', status: 'in-progress', type: 'TASK' },
  { id: 'MM-4', status: 'proposed', type: 'EPIC' },
];

const sound = (): Record<string, unknown> => ({
  milestones: [
    { id: 'M1', requires: [{ workstream: 'WS-A', tickets: ['MM-2'] }] },
    { id: 'M2', requires: [{ workstream: 'WS-B', tickets: ['MM-3'] }] },
    { id: 'M4' },
  ],
  workstreams: [
    {
      id: 'WS-A',
      dependsOn: [],
      unlocks: ['WS-B'],
      sourceRequirements: { built: ['MM-1'], remaining: ['MM-2', 'MM-4'] },
      sequence: [
        { step: 1, tickets: ['MM-1'], milestone: 'M0' },
        { step: 2, tickets: ['MM-2'], milestone: 'M1' },
      ],
    },
    {
      id: 'WS-B',
      dependsOn: ['WS-A'],
      unlocks: [],
      sourceRequirements: { built: [], remaining: ['MM-3'] },
      sequence: [{ step: 1, tickets: ['MM-3'], milestone: 'M2' }],
    },
  ],
  dependencyEdges: [
    { from: 'WS-A', to: 'WS-B', type: 'hard-blocker', scope: [1], satisfiedBy: ['MM-1'] },
    { from: 'WS-B', to: 'WS-A', type: 'integration-risk' },
  ],
});

/** Changes one workstream of a sound roadmap. */
const withWorkstream = (id: string, change: (ws: Record<string, unknown>) => void): Record<string, unknown> => {
  const roadmap = sound();
  const ws = (roadmap['workstreams'] as Record<string, unknown>[]).find((w) => w['id'] === id)!;
  change(ws);
  return roadmap;
};

test('a roadmap that matches the tickets has no problems', () => {
  assert.deepEqual(roadmapProblems(sound(), tickets), []);
});

test('a ticket in no workstream is reported, and so is one in two', () => {
  const missing = roadmapProblems(sound(), [...tickets, { id: 'MM-5', status: 'proposed', type: 'BUG' }]);
  assert.equal(missing.length, 1);
  assert.match(missing[0]!, /MM-5 is in no workstream/);

  const twice = withWorkstream('WS-B', (ws) => {
    (ws['sourceRequirements'] as { remaining: string[] }).remaining.push('MM-2');
  });
  const problems = roadmapProblems(twice, tickets);
  assert.ok(problems.some((p) => /MM-2 is in 2 workstreams/.test(p)), problems.join('\n'));
});

test('built and remaining follow the ticket status', () => {
  const finished = roadmapProblems(sound(), tickets.map((t) => (t.id === 'MM-2' ? { ...t, status: 'done' } : t)));
  assert.ok(finished.some((p) => /MM-2 as remaining, but it is done/.test(p)), finished.join('\n'));

  const reopened = roadmapProblems(sound(), tickets.map((t) => (t.id === 'MM-1' ? { ...t, status: 'in-progress' } : t)));
  assert.ok(reopened.some((p) => /MM-1 as built, but its status is in-progress/.test(p)), reopened.join('\n'));
});

test('a remaining ticket must be in one step, unless it is an epic', () => {
  const noStep = withWorkstream('WS-A', (ws) => {
    (ws['sequence'] as { tickets: string[] }[])[1]!.tickets = [];
  });
  const problems = roadmapProblems(noStep, tickets);
  assert.ok(problems.some((p) => /MM-2 is remaining in WS-A but in none of its steps/.test(p)), problems.join('\n'));
  assert.ok(!problems.some((p) => /MM-4/.test(p)), 'the epic is not expected in a step');

  const twoSteps = withWorkstream('WS-A', (ws) => {
    (ws['sequence'] as { tickets: string[] }[])[0]!.tickets.push('MM-2');
  });
  const twice = roadmapProblems(twoSteps, tickets);
  assert.ok(twice.some((p) => /MM-2 is in 2 steps/.test(p)), twice.join('\n'));
});

test('a step cannot name a ticket of another workstream', () => {
  const stray = withWorkstream('WS-B', (ws) => {
    (ws['sequence'] as { tickets: string[] }[])[0]!.tickets.push('MM-1');
  });
  const problems = roadmapProblems(stray, tickets);
  assert.ok(problems.some((p) => /WS-B step 1 names MM-1, which is not in WS-B/.test(p)), problems.join('\n'));
});

test('an edge is satisfied by tickets of its own workstream and scopes real steps', () => {
  const roadmap = sound();
  (roadmap['dependencyEdges'] as Record<string, unknown>[])[0] = {
    from: 'WS-A',
    to: 'WS-B',
    type: 'hard-blocker',
    scope: [9],
    satisfiedBy: ['MM-3'],
  };
  const problems = roadmapProblems(roadmap, tickets);
  assert.ok(problems.some((p) => /satisfied by MM-3, which is not in WS-A/.test(p)), problems.join('\n'));
  assert.ok(problems.some((p) => /scopes step 9, which WS-B does not have/.test(p)), problems.join('\n'));
});

test('dependsOn and unlocks must match the ordering edges', () => {
  const problems = roadmapProblems(
    withWorkstream('WS-B', (ws) => {
      ws['dependsOn'] = [];
    }),
    tickets,
  );
  assert.ok(problems.some((p) => /WS-B dependsOn \[\] but its ordering edges say \[WS-A\]/.test(p)), problems.join('\n'));
});

test('a cycle among the ordering edges is reported', () => {
  const roadmap = sound();
  (roadmap['dependencyEdges'] as Record<string, unknown>[])[1] = { from: 'WS-B', to: 'WS-A', type: 'contract-dependency' };
  (roadmap['workstreams'] as Record<string, unknown>[])[0]!['dependsOn'] = ['WS-B'];
  (roadmap['workstreams'] as Record<string, unknown>[])[1]!['unlocks'] = ['WS-A'];
  const problems = roadmapProblems(roadmap, tickets);
  assert.ok(problems.some((p) => /form a cycle: WS-A → WS-B → WS-A/.test(p)), problems.join('\n'));
});

test('a milestone lists exactly the tickets of the steps tagged with it', () => {
  const roadmap = sound();
  (roadmap['milestones'] as Record<string, unknown>[])[0] = {
    id: 'M1',
    requires: [{ workstream: 'WS-A', tickets: ['MM-1'] }],
  };
  const problems = roadmapProblems(roadmap, tickets);
  assert.ok(problems.some((p) => /M1 does not list WS-A:MM-2/.test(p)), problems.join('\n'));
  assert.ok(problems.some((p) => /M1 lists WS-A:MM-1, but no step tagged M1/.test(p)), problems.join('\n'));
  assert.ok(!problems.some((p) => /M4/.test(p)), 'a milestone with no list is not checked');
});
