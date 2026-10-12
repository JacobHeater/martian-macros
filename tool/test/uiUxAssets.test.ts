import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, test } from 'node:test';
import { uiUxAssetProblems, uiUxAssetStatuses } from '../src/uiUxAssets.ts';

/**
 * MM-210: HTML UI/UX assets are kept in the requirements folder and linked
 * from the tickets they support.
 */
let root = '';

const put = (path: string, content: string) => {
  mkdirSync(dirname(`${root}/${path}`), { recursive: true });
  writeFileSync(`${root}/${path}`, content);
};

const ticket = (body: string) => `---\nid: MM-1\nstatus: done\ncomponent: food\n---\n\n# Story\n\n${body}`;

const page = '<!doctype html><title>Entry</title><p>Quantity</p>';
const entry =
  '- [Entry](../ui-ux-assets/entry.html) — Proposed. The quantity and unit fields of the food entry screen. Not approved.\n';

const readme = ({ unresolved = 'None.', elsewhere = '' }: { unresolved?: string; elsewhere?: string } = {}) =>
  `# UI/UX assets\n\n## Unresolved assets\n\n${unresolved}\n\n## HTML that is not a UI/UX asset\n\n${elsewhere}\n`;

const problems = (htmlFiles?: string[]) => uiUxAssetProblems(root, htmlFiles);

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'mm_ui_ux_assets'));
  put('requirements/ui-ux-assets/README.md', readme());
  put('requirements/ui-ux-assets/entry.html', page);
  put('requirements/food/STORY.entry.MM-1.md', ticket(`## UI/UX Assets\n\n${entry}`));
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

test('an asset in the folder, linked from its ticket, is fine', () => {
  assert.deepEqual(problems(['requirements/ui-ux-assets/entry.html']), []);
});

test('an entry may run over several lines', () => {
  put(
    'requirements/food/STORY.entry.MM-1.md',
    ticket('## UI/UX Assets\n\n- [Entry](../ui-ux-assets/entry.html) — Proposed. The quantity\n  and unit fields.\n\n## Notes\n- Other.\n'),
  );
  assert.deepEqual(problems(), []);
});

test('a new asset that no ticket lists is reported', () => {
  put('requirements/ui-ux-assets/chooser.html', '<p>Chooser</p>');
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /requirements\/ui-ux-assets\/chooser\.html/);
  assert.match(found[0]!, /no ticket lists it/);
});

test('a new asset put outside the folder is reported', () => {
  put('design/chooser.html', '<p>Chooser</p>');
  const found = problems(['design/chooser.html', 'requirements/ui-ux-assets/entry.html']);
  assert.equal(found.length, 1);
  assert.match(found[0]!, /design\/chooser\.html/);
  assert.match(found[0]!, /move it there/);
});

test('HTML that is not an asset is accounted for in the README', () => {
  put('roadmap/progress.html', '<p>Report</p>');
  put('requirements/ui-ux-assets/README.md', readme({ elsewhere: '- `roadmap/progress.html`: a generated report.' }));
  assert.deepEqual(problems(['roadmap/progress.html']), []);
});

test('a README entry for HTML that is gone is reported', () => {
  put('requirements/ui-ux-assets/README.md', readme({ elsewhere: '- `roadmap/progress.html`: a generated report.' }));
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /is missing. Take it off the list/);
});

test('a README entry for other HTML must say what it is', () => {
  put('roadmap/progress.html', '<p>Report</p>');
  put('requirements/ui-ux-assets/README.md', readme({ elsewhere: '- `roadmap/progress.html`' }));
  assert.ok(problems(['roadmap/progress.html']).some((p) => p.includes('must read')));
});

test('with no list of HTML files, the rest is still checked', () => {
  put('requirements/ui-ux-assets/chooser.html', '<p>Chooser</p>');
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /no ticket lists it/);
});

test('a link to a missing file is reported', () => {
  put(
    'requirements/food/STORY.entry.MM-1.md',
    ticket(`## UI/UX Assets\n\n${entry}- [Gone](../ui-ux-assets/gone.html) — Proposed. A lost page.\n`),
  );
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /food\/STORY\.entry\.MM-1\.md/);
  assert.match(found[0]!, /requirements\/ui-ux-assets\/gone\.html, which is missing/);
});

test('a link that leaves the folder is reported', () => {
  put('design/entry.html', page);
  put(
    'requirements/food/STORY.entry.MM-1.md',
    ticket(`## UI/UX Assets\n\n${entry}- [Other](../../design/entry.html) — Proposed. Kept elsewhere.\n`),
  );
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /outside requirements\/ui-ux-assets\//);
});

test('a link that is not relative is reported', () => {
  put(
    'requirements/food/STORY.entry.MM-1.md',
    ticket(`## UI/UX Assets\n\n${entry}- [Web](https://example.com/entry.html) — Proposed. On a site.\n`),
  );
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /needs a relative link/);
});

test('a status outside the four is reported', () => {
  put('requirements/food/STORY.entry.MM-1.md', ticket('## UI/UX Assets\n\n- [Entry](../ui-ux-assets/entry.html) — Approved. The fields.\n'));
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /status "Approved"/);
  assert.match(found[0]!, /exploratory, proposed/);
});

test('every status in the convention is accepted', () => {
  for (const status of uiUxAssetStatuses) {
    put(
      'requirements/food/STORY.entry.MM-1.md',
      ticket(`## UI/UX Assets\n\n- [Entry](../ui-ux-assets/entry.html) — ${status[0]!.toUpperCase()}${status.slice(1)}. The fields.\n`),
    );
    assert.deepEqual(problems(), [], status);
  }
});

test('an entry that says nothing about the asset is reported', () => {
  put('requirements/food/STORY.entry.MM-1.md', ticket('## UI/UX Assets\n\n- [Entry](../ui-ux-assets/entry.html) — Proposed.\n'));
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /does not say what it shows/);
});

test('an entry that is not a link is reported', () => {
  put('requirements/food/STORY.entry.MM-1.md', ticket(`## UI/UX Assets\n\n${entry}- See the entry page.\n`));
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /an asset entry must read/);
});

test('a section that lists nothing is reported', () => {
  put('requirements/ui-ux-assets/entry.html', page);
  put('requirements/food/STORY.entry.MM-1.md', ticket('## UI/UX Assets\n\nTo come.\n'));
  assert.ok(problems().some((p) => p.includes('lists no asset')));
});

test('a heading that is nearly right is reported', () => {
  for (const heading of ['## UI/UX assets', '### UI/UX Assets', '## UI UX Asset']) {
    put('requirements/food/STORY.entry.MM-1.md', ticket(`${heading}\n\n${entry}`));
    assert.ok(problems().some((p) => p.includes('must be exactly "## UI/UX Assets"')), heading);
  }
});

test('the heading inside a code example is not a section', () => {
  put(
    'requirements/food/STORY.entry.MM-1.md',
    ticket(`## UI/UX Assets\n\n${entry}\n## Notes\n\`\`\`markdown\n## UI/UX assets\n- [X](nowhere.html) — Nope. X.\n\`\`\`\n`),
  );
  assert.deepEqual(problems(), []);
});

test('one asset may be linked from two tickets', () => {
  put(
    'requirements/coach/STORY.other.MM-2.md',
    ticket('## UI/UX Assets\n\n- [Entry](../ui-ux-assets/entry.html) — Proposed. The same sheet, for its unit list.\n'),
  );
  assert.deepEqual(problems(), []);
});

test('two copies of one asset are reported', () => {
  put('requirements/ui-ux-assets/entry-copy.html', page);
  put(
    'requirements/coach/STORY.other.MM-2.md',
    ticket('## UI/UX Assets\n\n- [Entry](../ui-ux-assets/entry-copy.html) — Proposed. The same sheet again.\n'),
  );
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /entry\.html/);
  assert.match(found[0]!, /entry-copy\.html/);
  assert.match(found[0]!, /Keep one copy/);
});

test('an asset nobody could place is fine once recorded as unresolved', () => {
  put('requirements/ui-ux-assets/chooser.html', '<p>Chooser</p>');
  put(
    'requirements/ui-ux-assets/README.md',
    readme({ unresolved: '- [Chooser](chooser.html): seems to be a theme chooser. Decide\n  which ticket it belongs to.' }),
  );
  assert.deepEqual(problems(), []);
});

test('an unresolved record must say what is to be decided', () => {
  put('requirements/ui-ux-assets/chooser.html', '<p>Chooser</p>');
  put('requirements/ui-ux-assets/README.md', readme({ unresolved: '- [Chooser](chooser.html)' }));
  assert.ok(problems().some((p) => p.includes('does not say what must be decided')));
});

test('an unresolved record for a missing file is reported', () => {
  put('requirements/ui-ux-assets/README.md', readme({ unresolved: '- [Chooser](chooser.html): a chooser. Decide.' }));
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /chooser\.html is missing/);
});

test('an asset both linked and unresolved is reported', () => {
  put('requirements/ui-ux-assets/README.md', readme({ unresolved: '- [Entry](entry.html): unsure. Decide the ticket.' }));
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /no longer unresolved/);
});

test('local dependencies that exist are fine', () => {
  put('requirements/ui-ux-assets/entry/style.css', 'p { color: red; }');
  put('requirements/ui-ux-assets/entry/shot.png', 'png');
  put(
    'requirements/ui-ux-assets/entry.html',
    '<link rel="stylesheet" href="entry/style.css">' +
      '<img src="./entry/shot.png"><a href="#top">Top</a>' +
      '<a href="https://example.com">Reference</a>' +
      '<style>p { background: url(entry/shot.png); }</style>' +
      '<img src="data:image/png;base64,AAAA">',
  );
  assert.deepEqual(problems(), []);
});

test('a missing local dependency is reported', () => {
  put('requirements/ui-ux-assets/entry.html', '<link rel="stylesheet" href="entry/style.css"><p>Quantity</p>');
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /requirements\/ui-ux-assets\/entry\.html/);
  assert.match(found[0]!, /entry\/style\.css, which is missing/);
});

test('an asset that loads from the network is reported', () => {
  put(
    'requirements/ui-ux-assets/entry.html',
    '<script src="https://cdn.example.com/x.js"></script>' + "<link href='//fonts.example.com/f.css' rel='stylesheet'>",
  );
  const found = problems();
  assert.equal(found.length, 2);
  assert.ok(found.every((p) => p.includes('from the network')));
});

test('assets with no README are reported', () => {
  unlinkSync(`${root}/requirements/ui-ux-assets/README.md`);
  const found = problems();
  assert.equal(found.length, 1);
  assert.match(found[0]!, /README\.md is missing/);
});

test('this repository follows the convention', () => {
  const top = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  assert.deepEqual(uiUxAssetProblems(top), []);
});
