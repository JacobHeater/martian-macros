import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { uiUxAssetProblems, uiUxAssetsFolder } from '../src/uiUxAssets.ts';
import { uiSurfaceSources, uiUxCoverageFile, uiUxCoverageProblems } from '../src/uiUxCoverage.ts';

/**
 * MM-211: every view and component has an HTML drawing, and the manifest
 * that says so is checked against the source.
 */
let root = '';

const put = (path: string, content: string) => {
  mkdirSync(dirname(`${root}/${path}`), { recursive: true });
  writeFileSync(`${root}/${path}`, content);
};

const entry = ({
  source = 'apps/mobile/src/coach/CoachScreen.tsx',
  symbol = 'CoachScreen',
  asset = 'views/coach.html#coach-default',
  requirements = ['MM-24'] as unknown,
  status = 'covered',
  limits,
}: {
  source?: string;
  symbol?: string;
  asset?: string;
  requirements?: unknown;
  status?: string;
  limits?: string;
} = {}): Record<string, unknown> => ({
  source,
  symbol,
  kind: 'view',
  requirements,
  asset,
  states: ['populated'],
  verification: 'source-only',
  status,
  ...(limits === undefined ? {} : { limits }),
});

const manifest = (
  surfaces: Record<string, unknown>[],
  { flows = [], unresolved = [] }: { flows?: Record<string, unknown>[]; unresolved?: Record<string, unknown>[] } = {},
) => put(uiUxCoverageFile, JSON.stringify({ schema: 1, surfaces, flows, unresolved }));

const problems = () => uiUxCoverageProblems(root, new Set(['MM-24', 'MM-104']));

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'mm_ui_ux_coverage'));
  put('apps/mobile/src/coach/CoachScreen.tsx', 'export function CoachScreen() {\n  return <p>coach</p>;\n}\n');
  put('apps/mobile/src/coach/coachText.ts', "export const coachText = () => 'x';\n");
  put(`${uiUxAssetsFolder}/views/coach.html`, "<script>m.frame('coach-default', 'Coach', '', '')</script>");
  put(`${uiUxAssetsFolder}/index.html`, '<a href="views/coach.html">Coach</a>');
  manifest([entry()]);
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

test('a component file with its entry and its frame is fine', () => {
  assert.deepEqual(problems(), []);
});

describe('what draws something', () => {
  test('a .tsx file that returns JSX does; the rest does not', () => {
    put('apps/mobile/src/ui/MmDropdown.tsx', 'export function MmDropdown() {\n  return (\n    <select />\n  );\n}\n');
    put('apps/mobile/src/charts/ArcChart.tsx', 'export const ArcChart = () => <svg />;\n');
    // An effect with nothing of its own to draw.
    put('apps/mobile/src/app/HardwareBack.tsx', 'export function HardwareBack() {\n  return null;\n}\n');
    // Not components at all.
    put('apps/mobile/src/coach/CoachScreen.test.tsx', 'test("x", () => { const a = <p/>; return a; });\n');
    put('apps/mobile/src/coach/coachMath.ts', 'export const smaller = (a: number, b: number) => a < b;\n');
    assert.deepEqual(uiSurfaceSources(root), [
      'apps/mobile/src/charts/ArcChart.tsx',
      'apps/mobile/src/coach/CoachScreen.tsx',
      'apps/mobile/src/ui/MmDropdown.tsx',
    ]);
  });
});

test('a new component file that is not listed is reported', () => {
  put('apps/mobile/src/coach/NewCard.tsx', 'export function NewCard() {\n  return <div />;\n}\n');
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /coach\/NewCard\.tsx/);
  assert.match(found[0]!, /is not listed/);
});

test('a removed component file still listed is reported', () => {
  manifest([entry(), entry({ source: 'apps/mobile/src/coach/Gone.tsx', symbol: 'Gone' })]);
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /coach\/Gone\.tsx/);
  assert.match(found[0]!, /no longer exists/);
});

test('a file listed twice is reported', () => {
  manifest([entry(), entry()]);
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /is listed twice/);
});

test('a symbol the file does not declare is reported', () => {
  manifest([entry({ symbol: 'CoachPage' })]);
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /does not declare "CoachPage"/);
});

test('a sheet that does not exist is reported', () => {
  manifest([entry({ asset: 'views/gone.html#coach-default' })]);
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /views\/gone\.html is missing/);
});

test('a frame the sheet does not have is reported', () => {
  manifest([entry({ asset: 'views/coach.html#coach-renamed' })]);
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /views\/coach\.html/);
  assert.match(found[0]!, /no frame "coach-renamed"/);
});

test('an asset without a frame is reported', () => {
  manifest([entry({ asset: 'views/coach.html' })]);
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /must be "file\.html#frame"/);
});

test('a frame may be an element id as well as a drawn frame', () => {
  put(`${uiUxAssetsFolder}/views/coach.html`, '<h2 id="coach-default">x</h2>');
  assert.deepEqual(problems(), []);
});

test('two files may share one frame', () => {
  put('apps/mobile/src/coach/ReportsCard.tsx', 'export function ReportsCard() {\n  return <div />;\n}\n');
  manifest([entry(), entry({ source: 'apps/mobile/src/coach/ReportsCard.tsx', symbol: 'ReportsCard' })]);
  assert.deepEqual(problems(), []);
});

test('a requirement no ticket has is reported', () => {
  manifest([entry({ requirements: ['MM-24', 'MM-999'] })]);
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /names MM-999, which no ticket has/);
});

test('an entry with no requirement is reported', () => {
  manifest([entry({ requirements: [] })]);
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /lists no requirements/);
});

test('not drawn needs a reason; with one it is fine', () => {
  manifest([entry({ status: 'not-drawn' })]);
  const first = problems();
  assert.equal(first.length, 1);
  assert.match(first[0]!, /does not say why under "limits"/);
  manifest([entry({ status: 'not-drawn', limits: 'It draws nothing itself.' })]);
  assert.deepEqual(problems(), []);
});

test('unknown kind, verification and status are reported', () => {
  manifest([{ ...entry(), kind: 'screen', verification: 'looked', status: 'done', limits: 'x' }]);
  assert.equal(problems().length, 3);
});

test('an entry with no states is reported', () => {
  manifest([{ ...entry(), states: [] }]);
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /lists no states/);
});

test('a flow is checked like a surface', () => {
  manifest([entry()], {
    flows: [
      { id: 'check-in', requirements: ['MM-24'], asset: 'views/coach.html#coach-default' },
      { id: 'lost', requirements: ['MM-24'], asset: 'views/coach.html#nowhere' },
    ],
  });
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /flow lost/);
});

test('an unresolved item says what must be decided', () => {
  manifest([entry()], { unresolved: [{ what: 'A card nobody asked for', decision: 'Which ticket?' }] });
  assert.deepEqual(problems(), []);
  manifest([entry()], { unresolved: [{ what: 'A card nobody asked for' }] });
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /"decision"/);
});

test('a sheet the index does not link is reported', () => {
  put(`${uiUxAssetsFolder}/index.html`, '<p>Nothing yet</p>');
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /index\.html does not link views\/coach\.html/);
});

test('a missing index is reported', () => {
  unlinkSync(`${root}/${uiUxAssetsFolder}/index.html`);
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /index\.html is missing/);
});

test('components with no manifest at all are reported', () => {
  unlinkSync(`${root}/${uiUxCoverageFile}`);
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /coverage\.json is missing/);
});

test('a manifest that is not JSON is reported, not thrown', () => {
  put(uiUxCoverageFile, '{ not json');
  assert.match(problems()[0]!, /not valid JSON/);
  put(uiUxCoverageFile, '{"schema": 2}');
  assert.match(problems()[0]!, /"schema": 1/);
});

describe('links to frames', () => {
  const ticket = (link: string) =>
    put(
      'requirements/coach/STORY.coach.MM-24.md',
      `---\nid: MM-24\nstatus: done\ncomponent: coach\n---\n\n# Story\n\n## UI/UX Assets\n\n- [Coach](${link}) — Current. The Coach screen.\n`,
    );

  beforeEach(() => {
    put(`${uiUxAssetsFolder}/README.md`, '# Assets\n\n## Unresolved assets\n\n- [Index](index.html): the way in. Decide nothing.\n');
  });

  test('a ticket may link a frame that exists', () => {
    ticket('../ui-ux-assets/views/coach.html#coach-default');
    assert.deepEqual(uiUxAssetProblems(root), []);
  });

  test('a ticket linking a frame that does not exist is reported', () => {
    ticket('../ui-ux-assets/views/coach.html#no-such-frame');
    const found = uiUxAssetProblems(root);
    assert.equal(found.length, 1);
    assert.match(found[0]!, /coach\/STORY\.coach\.MM-24\.md/);
    assert.match(found[0]!, /no frame "no-such-frame"/);
  });

  test('a sheet linking a frame another sheet lacks is reported', () => {
    ticket('../ui-ux-assets/views/coach.html#coach-default');
    put(`${uiUxAssetsFolder}/index.html`, '<a href="views/coach.html#coach-gone">Coach</a>');
    const found = uiUxAssetProblems(root);
    assert.equal(found.length, 1);
    assert.match(found[0]!, /index\.html/);
    assert.match(found[0]!, /no frame "coach-gone"/);
  });
});

test('this repository lists every component file and every frame exists', () => {
  const top = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const ids = new Set<string>();
  const walk = (folder: string) => {
    for (const name of readdirSync(folder)) {
      const path = `${folder}/${name}`;
      if (statSync(path).isDirectory()) {
        walk(path);
      } else {
        const id = /\.(MM-\d+)\.md$/.exec(path);
        if (id !== null) ids.add(id[1]!);
      }
    }
  };
  walk(`${top}/requirements`);
  assert.ok(uiSurfaceSources(top).length > 0);
  assert.deepEqual(uiUxCoverageProblems(top, ids), []);
});
