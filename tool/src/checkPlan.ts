/**
 * What `mm check` runs (MM-619): every part in order for a person, or one
 * part for a CI job, so CI runs its parts at the same time and still calls
 * `mm` (MM-7).
 *
 * - `static`: requirements, panel, the tool's tests, then the web app's type
 *   check, build, offline check and legal page.
 * - `tests`: the web app's rules and screens, optionally one shard of them.
 * - `stories`: every story drawn under coverage, and the unseen check (MM-321).
 */
export type CheckPart = 'static' | 'tests' | 'stories';

export interface CheckStep {
  /** `req`, `panel` and `tool` run in the tool itself; the rest are commands in the web app. */
  readonly name: string;
  readonly web?: readonly string[];
}

export interface CheckPlan {
  readonly steps: readonly CheckStep[];
}

const parts: readonly CheckPart[] = ['static', 'tests', 'stories'];

/** The steps of `mm check [--part static|tests|stories] [--shard i/n]`, or an error to print. */
export function checkPlan(args: readonly string[]): CheckPlan | string {
  const partAt = args.indexOf('--part');
  const part = partAt === -1 ? undefined : args[partAt + 1];
  if (partAt !== -1 && !parts.includes(part as CheckPart)) return `--part takes one of ${parts.join(', ')}.`;
  const shardAt = args.indexOf('--shard');
  const shard = shardAt === -1 ? undefined : args[shardAt + 1];
  if (shardAt !== -1) {
    const match = /^(\d+)\/(\d+)$/.exec(shard ?? '');
    if (match === null || Number(match[1]) < 1 || Number(match[1]) > Number(match[2])) return '--shard takes i/n, with 1 ≤ i ≤ n.';
    if (part !== 'tests') return '--shard goes with --part tests.';
  }
  const tests: CheckStep = {
    name: 'tests',
    web: ['npx', 'vitest', 'run', '--project', 'rules', '--project', 'screens', ...(shard === undefined ? [] : [`--shard=${shard}`])],
  };
  const staticSteps: CheckStep[] = [
    { name: 'req' },
    { name: 'panel' },
    { name: 'tool' },
    { name: 'typecheck', web: ['npm', 'run', 'typecheck'] },
  ];
  const after: CheckStep[] = [
    { name: 'build', web: ['npm', 'run', 'build'] },
    { name: 'offline', web: ['npm', 'run', 'offline'] },
    { name: 'legal', web: ['npm', 'run', 'legal'] },
  ];
  const stories: CheckStep = { name: 'stories', web: ['npm', 'run', 'unseen'] };
  switch (part as CheckPart | undefined) {
    case 'static':
      return { steps: [...staticSteps, ...after] };
    case 'tests':
      return { steps: [tests] };
    case 'stories':
      return { steps: [stories] };
    default:
      return { steps: [...staticSteps, tests, stories, ...after] };
  }
}
