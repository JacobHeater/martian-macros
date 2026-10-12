import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, test } from 'node:test';
import { PanelChecker } from '../src/panelChecker.ts';
import { runPanel } from '../src/panelCommand.ts';

const source = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const checker = new PanelChecker();
let root = '';
let run = '';
let state: Record<string, unknown> = {};

function copyDirectory(path: string): void {
  const from = `${source}/${path}`;
  const walk = (folder: string) => {
    for (const name of readdirSync(folder)) {
      const file = `${folder}/${name}`;
      if (statSync(file).isDirectory()) {
        walk(file);
      } else {
        const relative = file.slice(source.length + 1);
        mkdirSync(dirname(`${root}/${relative}`), { recursive: true });
        copyFileSync(file, `${root}/${relative}`);
      }
    }
  };
  walk(from);
}

function checkRun(): string[] {
  writeFileSync(`${run}/state.json`, JSON.stringify(state));
  return checker.check(root, run);
}

const assignment = (role: string, status: string): Record<string, unknown> => ({
  task: 'Check the bounded synthetic test fixture.',
  role,
  reviewer: 'test-session',
  status,
  inspected_commit: 'a'.repeat(40),
  input_hashes: Object.fromEntries(
    [`agents/roles/${role}.md`, 'agents/panel-protocol.md', 'agents/review-contract.md'].map((path) => [path, 'b'.repeat(64)]),
  ),
  report: `findings/${role}.md`,
  coverage: {
    inspected: ['Synthetic fixture only.'],
    not_inspected: ['Application behavior.'],
    referrals: [],
    methods: ['source-inspection'],
    limitations: 'Synthetic validator fixture, no real audit.',
  },
  research: {
    status: 'unnecessary',
    question: '',
    reason: 'Mechanical synthetic fixture test.',
    path: 'not-needed',
    sources: [],
    summary: 'No external factual claims in this test fixture.',
    limitations: 'Synthetic validator test, not a real review.',
  },
});

const put = (path: string, content: string) => {
  mkdirSync(dirname(`${root}/${path}`), { recursive: true });
  writeFileSync(`${root}/${path}`, content);
};

const edit = (path: string, change: (text: string) => string) => writeFileSync(`${root}/${path}`, change(readFileSync(`${root}/${path}`, 'utf8')));

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'mm_panel_test'));
  copyDirectory('agents');
  copyDirectory('.claude/agents');
  copyDirectory('.github/agents');
  run = `${root}/docs/agent-runs/test-run`;
  mkdirSync(run, { recursive: true });
  for (const name of ['brief.md', 'decision.md', 'handoff.md']) {
    copyFileSync(`${root}/agents/templates/${name}`, `${run}/${name}`);
  }
  state = JSON.parse(readFileSync(`${root}/agents/templates/state.json`, 'utf8')) as Record<string, unknown>;
  state['task_id'] = 'test-run';
  state['baseline'] = { branch: 'test-branch', commit: 'a'.repeat(40) };
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

test('canonical package and initial run validate', () => {
  assert.deepEqual(checker.check(root), []);
  assert.deepEqual(checkRun(), []);
});

test('missing canonical role fails', () => {
  unlinkSync(`${root}/agents/roles/training.md`);
  assert.ok(checker.check(root).includes('Missing agents/roles/training.md'));
});

test('role responsibilities and index coverage are required', () => {
  edit('agents/roles/training.md', (text) => text.replaceAll('## Exclusions', '## Other'));
  edit('agents/README.md', (text) => text.replaceAll('roles/training.md', 'other.md'));
  const errors = checker.check(root);
  assert.ok(errors.some((e) => e.includes('missing section: Exclusions')));
  assert.ok(errors.some((e) => e.includes('must link')));
});

test('adapter cannot grant shell tools or lose canonical references', () => {
  edit('.claude/agents/panel-training.md', (text) =>
    text.replaceAll('tools: Read, Grep, Glob', 'tools: Read, Bash').replaceAll('agents/review-contract.md', 'other.md'),
  );
  const errors = checker.check(root);
  assert.ok(errors.some((e) => e.includes('restricted Claude')));
  assert.ok(errors.some((e) => e.includes('review-contract.md')));
});

test('Copilot coverage, research tools and reviewer restrictions are required', () => {
  edit('.github/agents/panel-training.agent.md', (text) =>
    text.replaceAll('"web"', '"execute"').replaceAll('agents: []', 'agents: ["panel-chair"]'),
  );
  const errors = checker.check(root);
  assert.ok(errors.some((e) => e.includes('Copilot tool allowlist')));
  assert.ok(errors.some((e) => e.includes('restrict native delegation')));
  unlinkSync(`${root}/.github/agents/panel-training.agent.md`);
  assert.ok(checker.check(root).includes('Missing .github/agents/panel-training.agent.md'));
});

test('Copilot malformed frontmatter and broken shared references fail', () => {
  edit('.github/agents/panel-qa.agent.md', (text) =>
    text.replaceAll('agents/review-contract.md', 'other.md').replaceAll('tools: [', 'tools: invalid ['),
  );
  const errors = checker.check(root);
  assert.ok(errors.some((e) => e.includes('not valid JSON')));
  assert.ok(errors.some((e) => e.includes('review-contract.md')));
});

test('performed research cannot be claimed without consulted sources', () => {
  const item = assignment('integrations', 'pending');
  (item['research'] as Record<string, unknown>)['status'] = 'performed';
  state['assignments'] = [item];
  assert.ok(checkRun().some((e) => e.includes('performed research needs')));
});

test('performed evidence requires observed discovery and retrieval, not YAML claims', () => {
  const item = assignment('integrations', 'pending');
  const research = item['research'] as Record<string, unknown>;
  research['status'] = 'performed';
  research['question'] = 'Synthetic platform question';
  research['path'] = 'chair';
  research['sources'] = [
    {
      url: 'https://example.com/source',
      title: 'Synthetic source fixture',
      published_or_updated: null,
      accessed: '2026-10-11',
      claim: 'Test-only fixture, not consulted evidence.',
    },
  ];
  state['assignments'] = [item];
  assert.ok(checkRun().some((e) => e.includes('observed discovery/retrieval')));
  state['research_capabilities'] = [
    {
      surface: 'Synthetic fixture',
      discovery: ['fixture-search'],
      retrieval: ['fixture-fetch'],
      status: 'observed',
      checked_at: '2026-10-11',
      limitations: 'Synthetic validator test only.',
    },
  ];
  assert.deepEqual(checkRun(), []);
});

test('source dates, URL and bounded assignment fields are validated', () => {
  const item = assignment('integrations', 'pending');
  item['research'] = {
    status: 'performed',
    question: 'Current documented API?',
    reason: 'Potentially outdated capability.',
    path: 'chair',
    sources: [
      { url: 'invented', title: '', published_or_updated: null, accessed: 'yesterday', claim: 'Test-only invalid source.' },
    ],
    summary: 'Test fixture.',
    limitations: 'Not actual evidence.',
  };
  delete item['task'];
  state['assignments'] = [item];
  const errors = checkRun();
  assert.ok(errors.some((e) => e.includes('missing task')));
  assert.ok(errors.some((e) => e.includes('.url has invalid format')));
  assert.ok(errors.some((e) => e.includes('.title must not be empty')));
  assert.ok(errors.some((e) => e.includes('.accessed has invalid format')));
});

test('completed research requires matching report and resolved evidence', () => {
  const item = assignment('integrations', 'complete');
  (item['research'] as Record<string, unknown>)['status'] = 'blocked';
  (item['research'] as Record<string, unknown>)['path'] = 'unavailable';
  state['assignments'] = [item];
  put('docs/agent-runs/test-run/findings/integrations.md', 'Incomplete synthetic report');
  const errors = checkRun();
  assert.ok(errors.some((e) => e.includes('report missing section')));
  assert.ok(errors.some((e) => e.includes('unresolved research')));
});

test('schema role coverage and malformed schema fail clearly', () => {
  const path = `${root}/agents/state.schema.json`;
  const schema = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const properties = schema['properties'] as Record<string, unknown>;
  const items = (properties['assignments'] as Record<string, unknown>)['items'] as Record<string, unknown>;
  const role = (items['properties'] as Record<string, unknown>)['role'] as Record<string, unknown>;
  role['enum'] = (role['enum'] as string[]).filter((name) => name !== 'qa');
  writeFileSync(path, JSON.stringify(schema));
  assert.ok(checker.check(root).some((e) => e.includes('15 canonical')));
  writeFileSync(path, '{}');
  assert.ok(checker.check(root).includes('Schema missing assignments role enum'));
  writeFileSync(path, '{');
  assert.ok(checker.check(root).some((e) => e.includes('not valid JSON')));
});

test('MM-197 non-object schema cannot bypass panel validation', async () => {
  const path = `${root}/agents/state.schema.json`;
  for (const content of ['null', '[]', 'true', '"schema"']) {
    writeFileSync(path, content);
    assert.ok(checker.check(root).includes('Schema must be a JSON object'));
    assert.equal(await runPanel(root, []), 1);
  }
});

test('MM-197 native saved-run separators validate on Windows', { skip: process.platform !== 'win32' ? 'Windows path semantics' : false }, () => {
  assert.deepEqual(checkRun(), []);
  assert.deepEqual(checker.check(root, run.replaceAll('/', '\\')), []);
});

test('MM-199 malformed schema keywords fail without throwing', async () => {
  const path = `${root}/agents/state.schema.json`;
  const original = readFileSync(path, 'utf8');
  const broken: Record<string, unknown> = {
    required: 'not-a-list',
    properties: [],
    minLength: 'one',
    pattern: '[',
    items: [],
    additionalProperties: 'invalid',
    enum: 'invalid',
    type: ['object', 1],
  };
  for (const [keyword, value] of Object.entries(broken)) {
    const schema = JSON.parse(original) as Record<string, unknown>;
    schema[keyword] = value;
    writeFileSync(path, JSON.stringify(schema));
    assert.ok(checker.check(root).some((e) => e.includes('Schema keyword')), keyword);
    assert.equal(await runPanel(root, []), 1);
  }
});

test('template schema rejects extra fields and invalid enums', () => {
  state['phase'] = 'invented';
  state['extra'] = true;
  writeFileSync(`${root}/agents/templates/state.json`, JSON.stringify(state));
  const errors = checker.check(root);
  assert.ok(errors.includes('template.phase has unsupported value'));
  assert.ok(errors.includes('template has unknown field extra'));
});

test('MM-201 audit mode, coverage and canonical audit invocation are required', () => {
  state['audit_mode'] = 'planning-only';
  const item = assignment('nutrition', 'complete');
  (item['coverage'] as Record<string, unknown>)['inspected'] = [];
  (item['coverage'] as Record<string, unknown>)['methods'] = [];
  state['assignments'] = [item];
  assert.ok(checkRun().includes('state.audit_mode has unsupported value'));
  state['audit_mode'] = 'feature';
  assert.ok(checkRun().some((e) => e.includes('completed audit needs')));
  delete item['coverage'];
  assert.ok(checkRun().includes('state.assignments[0] missing coverage'));
  edit('agents/roles/nutrition.md', (text) => text.replaceAll('## Existing implementation audit', '## Other'));
  edit('.github/agents/panel-nutrition.agent.md', (text) => text.replaceAll('existing-implementation audit protocol', 'planning only'));
  const errors = checker.check(root);
  assert.ok(errors.some((e) => e.includes('missing section: Existing implementation audit')));
  assert.ok(errors.some((e) => e.includes('missing shared audit invocation')));
});

test('run requires identity, real baseline and local artifacts', () => {
  state['task_id'] = 'wrong-dir';
  (state['baseline'] as Record<string, unknown>)['commit'] = '0'.repeat(40);
  unlinkSync(`${run}/brief.md`);
  const errors = checkRun();
  assert.ok(errors.some((e) => e.includes('Run must live')));
  assert.ok(errors.some((e) => e.includes('placeholder')));
  assert.ok(errors.some((e) => e.includes('brief.md')));
});

test('edit ownership and checkpoint stop acknowledgement are mandatory', () => {
  state['phase'] = 'edits';
  assert.ok(checkRun().includes('Edits require one designated owner'));
  state['phase'] = 'checkpoint';
  state['owner'] = { identity: 'writer', paths: ['../outside'] };
  const errors = checkRun();
  assert.ok(errors.some((e) => e.includes('repository-relative paths')));
  assert.ok(errors.some((e) => e.includes('Checkpoint requires')));
});

test('complete review needs report, commit and canonical hashes', () => {
  const item = assignment('training', 'complete');
  item['inspected_commit'] = null;
  item['input_hashes'] = {};
  state['assignments'] = [item];
  const errors = checkRun();
  assert.ok(errors.some((e) => e.includes('needs a commit')));
  assert.ok(errors.some((e) => e.includes('missing canonical input')));
  assert.ok(errors.some((e) => e.includes('report missing')));
});

test('report traversal and duplicate assignments fail', () => {
  const item = assignment('training', 'pending');
  item['report'] = '../outside.md';
  item['input_hashes'] = { '../outside': 'a'.repeat(64) };
  state['assignments'] = [item, assignment('training', 'pending')];
  const errors = checkRun();
  assert.ok(errors.some((e) => e.includes('Duplicate assignment')));
  assert.ok(errors.some((e) => e.includes('must be findings/training.md')));
  assert.ok(errors.some((e) => e.includes('input paths')));
});

test('actual exit code must match the recorded test result', () => {
  state['tests'] = [
    {
      command: 'mm test tool',
      commit: 'a'.repeat(40),
      dirty: true,
      exit_code: 1,
      result: 'passed',
      summary: 'Inconsistent test fixture',
    },
  ];
  assert.ok(checkRun().includes('Test result/exit code disagree: mm test tool'));
});

test('complete phase cannot conceal pending work or stale reviews', () => {
  state['phase'] = 'complete';
  state['assignments'] = [assignment('training', 'stale')];
  const errors = checkRun();
  assert.ok(errors.some((e) => e.includes('Core role')));
  assert.ok(errors.some((e) => e.includes('unresolved work')));
});

test('checkpoint with completed/omitted core reviews validates', () => {
  state['phase'] = 'checkpoint';
  state['checkpoint'] = { at: '2026-10-11T02:00:00Z', writers_stopped: true };
  const brief = readFileSync(`${run}/brief.md`, 'utf8');
  writeFileSync(`${run}/brief.md`, `${brief}\nMechanical fixture; domain review unnecessary.\n`);
  state['assignments'] = [
    assignment('chair', 'complete'),
    ...['training', 'nutrition', 'coaching', 'measurement', 'safety'].map((role) => ({
      ...assignment(role, 'omitted'),
      omission_reason: 'Mechanical fixture; domain review unnecessary.',
    })),
  ];
  put('docs/agent-runs/test-run/findings/chair.md', readFileSync(`${root}/agents/templates/findings/role.md`, 'utf8'));
  assert.deepEqual(checkRun(), []);
});

test('MM-200 complete runs cannot omit reviews without recorded reasons', () => {
  state['phase'] = 'complete';
  state['pending_work'] = [];
  state['checkpoint'] = { at: '2026-10-11T02:00:00Z', writers_stopped: true };
  state['assignments'] = ['chair', 'training', 'nutrition', 'coaching', 'measurement', 'safety'].map((role) =>
    assignment(role, 'omitted'),
  );
  assert.ok(checkRun().some((e) => e.includes('omission needs a recorded reason')));
  for (const item of state['assignments'] as Record<string, unknown>[]) {
    item['omission_reason'] = 'Mechanical fixture; domain review unnecessary.';
  }
  assert.ok(checkRun().some((e) => e.includes('omission reason missing from brief/report')));
  const brief = readFileSync(`${run}/brief.md`, 'utf8');
  writeFileSync(`${run}/brief.md`, `${brief}\nMechanical fixture; domain review unnecessary.\n`);
  assert.deepEqual(checkRun(), []);
});

test('command validates package and rejects unsupported flags', async () => {
  assert.equal(await runPanel(root, []), 0);
  assert.equal(await runPanel(root, ['--repair']), 64);
});
