import { GhFailure } from './ghFailure.ts';
import type { GhResult } from './ghResult.ts';
import type { GhRunner } from './ghRunner.ts';
import type { CheckObservation } from './checkObservation.ts';
import { normalizeCheckState } from './checkState.ts';
import { PrSnapshot } from './prSnapshot.ts';
import type { RequiredDiscovery } from './requiredDiscovery.ts';

const prFields = 'number,state,headRefOid,isDraft,mergeable,mergeStateStatus,url,statusCheckRollup';
const requiredFields = 'name,state,bucket,workflow,link';

const key = (workflow: string | undefined, name: string) =>
  workflow === undefined || workflow === '' ? name : `${workflow} / ${name}`;

const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);

/** gh prints year 1 for a time that has not happened. */
const time = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' && !value.startsWith('0001-') ? value : undefined;

function object(printed: string): Record<string, unknown> {
  try {
    const decoded: unknown = JSON.parse(printed.trim());
    if (typeof decoded === 'object' && decoded !== null && !Array.isArray(decoded)) return decoded as Record<string, unknown>;
  } catch {
    // Fall through.
  }
  throw new GhFailure('other', 'gh printed something that is not the JSON asked for.');
}

/** One short line of what gh said, with anything shaped like a token removed. */
function redact(stderr: string, exitCode: number): string {
  const line = stderr
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l !== '') ?? '';
  const safe = line
    .replace(/\b(gh[pousr]_|github_pat_)[A-Za-z0-9_]+/g, '***')
    .replace(/(token|authorization)\S*\s*[:=]\s*\S+/gi, '***');
  const short = safe.length > 200 ? `${safe.slice(0, 200)}...` : safe;
  return short === '' ? `gh exited with code ${exitCode}.` : short;
}

function failureOf(result: GhResult): GhFailure {
  const said = result.stderr.toLowerCase();
  const kind = said.includes('rate limit')
    ? 'rateLimit'
    : said.includes('gh auth login') || said.includes('authentication') || said.includes('http 401') || said.includes('bad credentials')
      ? 'auth'
      : said.includes('could not resolve') || said.includes('not found') || said.includes('no pull requests found')
        ? 'notFound'
        : 'other';
  return new GhFailure(kind, redact(result.stderr, result.exitCode));
}

/**
 * Reads a pull request and its checks through `gh`, read-only.
 *
 * The pull request, its head commit and that commit's checks come from one
 * answer, so they belong together. The required checks are a second
 * question; the head is asked for again afterwards, and if it moved the
 * whole read is done again, so a snapshot never mixes two commits.
 */
export class GithubReader {
  private readonly gh: GhRunner;

  /** How many times to start over when the head moves mid-read. */
  readonly headRetries: number;

  constructor(gh: GhRunner, { headRetries = 2 }: { headRetries?: number } = {}) {
    this.gh = gh;
    this.headRetries = headRetries;
  }

  /** The repository `gh` resolves for the working directory, `owner/name`. */
  async currentRepository(): Promise<string> {
    const result = await this.gh.run(['repo', 'view', '--json', 'nameWithOwner']);
    if (result.exitCode !== 0) throw failureOf(result);
    const name = object(result.stdout)['nameWithOwner'];
    if (typeof name !== 'string' || !name.includes('/')) {
      throw new GhFailure('other', 'gh did not name the repository.');
    }
    return name;
  }

  async read(repository: string, pr: number, now: Date): Promise<PrSnapshot> {
    for (let attempt = 0; attempt <= this.headRetries; attempt++) {
      const view = await this.view(repository, pr, prFields);
      const head = view['headRefOid'];
      if (typeof head !== 'string' || head === '') {
        throw new GhFailure('other', 'gh did not report a head commit.');
      }
      const checks = GithubReader.checks(view['statusCheckRollup']);
      const [discovery, required] = await this.required(repository, pr);
      // Only a pull request still taking pushes can move.
      if (view['state'] === 'OPEN') {
        const again = await this.view(repository, pr, 'headRefOid');
        if (again['headRefOid'] !== head) continue;
      }
      return new PrSnapshot({
        repository,
        pr,
        headSha: head,
        prState: `${view['state'] ?? 'UNKNOWN'}`,
        isDraft: view['isDraft'] === true,
        mergeable: text(view['mergeable']),
        mergeStateStatus: text(view['mergeStateStatus']),
        url: text(view['url']),
        requiredDiscovery: discovery,
        observedAt: now.toISOString(),
        checks: checks.map((check) => (required.has(check.key) ? { ...check, required: true } : check)),
      });
    }
    throw new GhFailure('headUnstable', 'The head commit changed on every attempt to read it.');
  }

  private async view(repository: string, pr: number, fields: string): Promise<Record<string, unknown>> {
    const result = await this.gh.run(['pr', 'view', `${pr}`, '--repo', repository, '--json', fields]);
    if (result.exitCode !== 0) throw failureOf(result);
    return object(result.stdout);
  }

  /** The keys of the required checks, and whether they could be discovered. */
  private async required(repository: string, pr: number): Promise<[RequiredDiscovery, Set<string>]> {
    const result = await this.gh.run(['pr', 'checks', `${pr}`, '--repo', repository, '--required', '--json', requiredFields]);
    // gh exits non-zero while required checks are pending or failed, and
    // still prints them; so the answer is judged by what it printed.
    try {
      const decoded: unknown = JSON.parse(result.stdout.trim());
      if (Array.isArray(decoded)) {
        return [
          'discovered',
          new Set(
            decoded
              .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
              .map((entry) => key(text(entry['workflow']), `${entry['name']}`)),
          ),
        ];
      }
    } catch {
      // Not a list of checks; see what it said instead.
    }
    if (result.stderr.includes('no required checks reported')) return ['noneReported', new Set()];
    const failure = failureOf(result);
    // Not being able to tell what is required must not hide that the login
    // or the rate limit is the problem.
    if (failure.kind === 'auth' || failure.kind === 'rateLimit') throw failure;
    return ['unknown', new Set()];
  }

  /**
   * One observation per check. When a check ran more than once for the
   * commit, the attempt that started last is the one that counts.
   */
  private static checks(rollup: unknown): CheckObservation[] {
    const byKey = new Map<string, CheckObservation>();
    for (const entry of Array.isArray(rollup) ? rollup : []) {
      if (typeof entry !== 'object' || entry === null) continue;
      const found = entry as Record<string, unknown>;
      let check: CheckObservation;
      if (found['__typename'] === 'StatusContext') {
        const name = `${found['context']}`;
        check = {
          key: key(undefined, name),
          name,
          kind: 'statusContext',
          state: normalizeCheckState(found['state'] as string | undefined, undefined),
          providerStatus: text(found['state']),
          url: text(found['targetUrl']),
          startedAt: time(found['startedAt']),
          required: false,
        };
      } else {
        const name = `${found['name']}`;
        const workflow = text(found['workflowName']);
        check = {
          key: key(workflow, name),
          name,
          kind: 'checkRun',
          workflow,
          state: normalizeCheckState(found['status'] as string | undefined, found['conclusion'] as string | undefined),
          providerStatus: text(found['status']),
          providerConclusion: text(found['conclusion']),
          url: text(found['detailsUrl']),
          startedAt: time(found['startedAt']),
          completedAt: time(found['completedAt']),
          required: false,
        };
      }
      const seen = byKey.get(check.key);
      if (seen === undefined || (check.startedAt ?? '') >= (seen.startedAt ?? '')) byKey.set(check.key, check);
    }
    return [...byKey.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  }
}
