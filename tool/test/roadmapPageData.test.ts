import assert from 'node:assert/strict';
import { test } from 'node:test';
import { roadmapPageData, type RoadmapTicket } from '../src/roadmap.ts';

const roadmap: Record<string, unknown> = {
  asOf: '2026-10-08',
  milestones: [{ id: 'M1', name: 'First' }],
  workstreams: [
    {
      id: 'WS-01',
      name: 'One </script>',
      intent: 'x',
      recommendedOrder: 1,
      riskLevel: 'low',
      dependsOn: [],
      sequence: [],
      gate: null,
      sourceRequirements: { built: ['MM-1'], remaining: ['MM-2'] },
    },
  ],
};
const tickets: RoadmapTicket[] = [
  { id: 'MM-1', title: 'A', status: 'done', component: 'c' },
  { id: 'MM-2', title: 'B', status: 'proposed', component: 'c' },
];

test('the page data carries ticket status from the tickets', () => {
  const json = roadmapPageData({ roadmap, tickets, generatedOn: '2026-10-08' });
  const data = JSON.parse(json.replaceAll(String.raw`<\/`, '</')) as Record<string, unknown>;
  const byId = data['tickets'] as Record<string, Record<string, string>>;
  assert.equal(byId['MM-1']!['status'], 'done');
  assert.equal(byId['MM-2']!['status'], 'proposed');
  const ws = (data['workstreams'] as Record<string, unknown>[])[0]!;
  assert.deepEqual((ws['listed'] as Record<string, unknown>)['built'], ['MM-1']);
});

test('a closing script tag in a string cannot end the page script', () => {
  const json = roadmapPageData({ roadmap, tickets, generatedOn: '2026-10-08' });
  assert.ok(!json.includes('</'));
});
