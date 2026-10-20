import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { stderr, stdout } from 'node:process';
import { runEmulator, runApp, runBuild, runClean, runDemo, runScreenshot } from './src/android.ts';
import { runCi } from './src/ci/ciCommand.ts';
import { runFood } from './src/food.ts';
import { cleanIos, isSimulatorId, runIosApp, runIosBuild, runSimulator, simulatorScreenshot, temporaryScreenshot } from './src/ios.ts';
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

/**
 * Installs the dependencies, then opts this machine out of the telemetry of
 * Capacitor's CLI (MM-243), which is on until it is turned off and is kept
 * for the machine, not the repository.
 */
async function bootstrap(): Promise<number> {
  const installed = await run(['npm', 'ci'], { cwd: webApp });
  if (installed !== 0) return installed;
  return run(['npx', 'cap', 'telemetry', 'off'], { cwd: webApp });
}

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

/** `mm screenshot`: a simulator by its UDID goes through simctl, anything else through adb (MM-238, MM-403). */
async function screenshot(args: readonly string[]): Promise<number> {
  const device = args.includes('-d') ? args[args.indexOf('-d') + 1] : undefined;
  if (device === undefined || !isSimulatorId(device)) return runScreenshot(args);
  const out = args.filter((arg, at) => !arg.startsWith('-') && args[at - 1] !== '-d');
  const stamp = new Date().toISOString().slice(0, 19).replaceAll(/[-:]/g, '').replace('T', '-');
  const clipboard = args.includes('--clipboard');
  const keepFile = out[0] !== undefined || !clipboard;
  const path = resolve(out[0] ?? (keepFile ? `mm-screenshot-${stamp}.png` : temporaryScreenshot(stamp)));
  const taken = await simulatorScreenshot(device, path);
  if (taken !== 0) return taken;
  if (!clipboard) {
    stdout.write(`${device} -> ${path}\n`);
    return 0;
  }
  const copied = await run(['osascript', '-e', `set the clipboard to (read (POSIX file "${path}") as «class PNGf»)`]);
  if (copied !== 0) {
    stderr.write(`The image could not be put on the clipboard. It is kept at ${path}\n`);
    return 1;
  }
  if (!keepFile) rmSync(path, { force: true });
  stdout.write(`${device} -> ${keepFile ? `${path} and the clipboard` : 'the clipboard'}\n`);
  return 0;
}

const commands: Record<string, [string, Command]> = {
  doctor: ['Check the toolchain', doctor],
  bootstrap: ['Install the exact dependencies from the lock file, and opt this machine out of Capacitor telemetry', bootstrap],
  check: ['CI gate: requirements, panel, tool tests, web (type check, tests, build, offline)', check],
  web: ['Check the React app: type check, tests, build, offline', web],
  storybook: ['The design register, live: mm storybook [build] (MM-237)', (a) => run(['npm', 'run', a[0] === 'build' ? 'build-storybook' : 'storybook'], { cwd: webApp })],
  test: ['Run the tests: the tool’s own, then the web suite (--tool for the tool alone)', test],
  req: ['Requirements: mm req [list | next | show <id>] (no args validates)', (a) => runRequirements(repoRoot, a)],
  panel: ['Expert panel: validate roles, native adapters and templates [run-dir]', (a) => runPanel(repoRoot, a)],
  ci: ['Watch pull request checks without waiting: mm ci help', (a) => runCi(repoRoot, a)],
  roadmap: ['Write roadmap/progress.html, the progress page: mm roadmap [--check] [--no-open]', (a) => runRoadmapReport(repoRoot, a)],
  food: ['Build the food packs: mm food fetch | build | package', (a) => runFood(repoRoot, a)],
  run: ['Build, install and launch on a device: mm run [-d DEVICE] [--env phone] [--live [--port N]] (--live: hot reload from the dev server); mm run --ios [-d UDID] for a simulator; mm run --ios --phone [name | id] for the iPhone plugged in (MM-412)', (a) => (a.includes('--ios') ? runIosApp(repoRoot, a) : runApp(repoRoot, a))],
  demo: ['The isolated demo app on an exact device: mm demo [--seed] -d <device ID>', (a) => runDemo(repoRoot, a)],
  emulator: ['Start an emulator: mm emulator [id] [--cold] | list', (a) => runEmulator(repoRoot, a)],
  simulator: ['Start an iPhone simulator: mm simulator [name | udid] | list (MM-403)', (a) => runSimulator(a)],
  screenshot: ['A device’s screen as a PNG: mm screenshot [-d DEVICE] [path] [--clipboard] (MM-238); a simulator by its UDID', (a) => screenshot(a)],
  build: ['Build the app: mm build android [--release] | mm build ios [--release] [--phone] (a simulator build, or a signed phone build)', (a) => (a[0] === 'ios' ? runIosBuild(repoRoot, a) : runBuild(repoRoot, a))],
  clean: ['Remove build outputs and caches', () => {
    cleanIos(repoRoot);
    return runClean(repoRoot);
  }],
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
