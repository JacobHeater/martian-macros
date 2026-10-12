import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { stderr, stdout } from 'node:process';
import { runEmulator, runApp, runBuild, runClean, runDemo } from './src/android.ts';
import { runCi } from './src/ci/ciCommand.ts';
import { runFood } from './src/food.ts';
import { runPanel } from './src/panelCommand.ts';
import { run } from './src/proc.ts';
import { runRequirements } from './src/requirements.ts';
import { runRoadmapReport } from './src/roadmap.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webApp = `${repoRoot}/apps/mobile`;

type Command = (args: readonly string[]) => Promise<number> | number;

/** Type checks the tool itself and runs its tests, then the web suite. */
async function test(args: readonly string[]): Promise<number> {
  const toolOnly = args.includes('--tool');
  const typecheck = await run(['npx', 'tsc', '-p', `${repoRoot}/tool`], { cwd: webApp });
  if (typecheck !== 0) return typecheck;
  const toolTests = await run(['node', '--test', 'tool/test/*.test.ts'], { cwd: repoRoot });
  if (toolTests !== 0 || toolOnly) return toolTests;
  return run(['npx', 'vitest', 'run'], { cwd: webApp });
}

/** Type check, tests, build and the offline check of the React app. */
const web: Command = () => run(['npm', 'run', 'check'], { cwd: webApp });

async function check(): Promise<number> {
  const steps: [string, Command][] = [
    ['req', (a) => runRequirements(repoRoot, a)],
    ['panel', (a) => runPanel(repoRoot, a)],
    ['tool', () => test(['--tool'])],
    ['web', web],
  ];
  for (const [, step] of steps) {
    const code = await step([]);
    if (code !== 0) return code;
  }
  stdout.write('\nAll checks passed.\n');
  return 0;
}

async function doctor(): Promise<number> {
  const [major = 0, minor = 0] = process.versions.node.split('.').map(Number);
  stdout.write(`OS:    ${process.platform}\nNode:  ${process.versions.node}\n`);
  const typeStripping = major > 23 || (major === 23 && minor >= 6) || (major === 22 && minor >= 18);
  if (!typeStripping) {
    stderr.write('\nThis task runner is TypeScript run by Node itself; it needs Node 22.18 or newer (23.6+ or 24 also fine).\n');
    return 1;
  }
  stdout.write('\nToolchain OK. Android builds also need a JDK and the Android SDK (ANDROID_HOME).\n');
  return 0;
}

const commands: Record<string, [string, Command]> = {
  doctor: ['Check the toolchain', doctor],
  bootstrap: ['Install the exact dependencies from the lock file', () => run(['npm', 'ci'], { cwd: webApp })],
  check: ['CI gate: requirements, panel, tool tests, web (type check, tests, build, offline)', check],
  web: ['Check the React app: type check, tests, build, offline', web],
  test: ['Run the tests: the tool’s own, then the web suite (--tool for the tool alone)', test],
  req: ['Requirements: mm req [list | next | show <id>] (no args validates)', (a) => runRequirements(repoRoot, a)],
  panel: ['Expert panel: validate roles, native adapters and templates [run-dir]', (a) => runPanel(repoRoot, a)],
  ci: ['Watch pull request checks without waiting: mm ci help', (a) => runCi(repoRoot, a)],
  roadmap: ['Write roadmap/progress.html, the progress page: mm roadmap [--check] [--no-open]', (a) => runRoadmapReport(repoRoot, a)],
  food: ['Build the food packs: mm food fetch | build | package', (a) => runFood(repoRoot, a)],
  run: ['Build, install and launch on a device: mm run [-d DEVICE]', (a) => runApp(repoRoot, a)],
  demo: ['The isolated demo app on an exact device: mm demo -d <device ID>', (a) => runDemo(repoRoot, a)],
  emulator: ['Start an emulator: mm emulator [id] [--cold] | list', (a) => runEmulator(repoRoot, a)],
  build: ['Build the Android app: mm build android [--release]', (a) => runBuild(repoRoot, a)],
  clean: ['Remove build outputs and caches', () => runClean(repoRoot)],
};

function help(): void {
  stdout.write('Martian Macros task runner\n\nUsage: mm <command> [args]\n\n');
  for (const [name, [description]] of Object.entries(commands)) {
    stdout.write(`  ${name.padEnd(10)} ${description}\n`);
  }
  stdout.write('\nTypeScript run by Node itself (22.18+); no build step.\n');
}

const args = process.argv.slice(2);
if (args.length === 0 || ['help', '-h', '--help'].includes(args[0]!)) {
  help();
  process.exit(args.length === 0 ? 64 : 0);
}
const entry = commands[args[0]!];
if (entry === undefined) {
  stderr.write(`Unknown command "${args[0]}".\n\n`);
  help();
  process.exit(64);
}
process.exit(await entry[1](args.slice(1)));
