import type { GhResult } from '../../src/ci/ghResult.ts';
import type { GhRunner } from '../../src/ci/ghRunner.ts';

/**
 * A pretend GitHub behind the `gh` boundary: a test sets what the pull
 * request looks like and the watch reads it as it would the real one.
 * Every observation it serves is simulated.
 */
export class FakeGh implements GhRunner {
  repository = 'octo/app';
  head = 'a1';
  prState = 'OPEN';
  mergeable = 'MERGEABLE';
  mergeStateStatus = 'CLEAN';

  /** The checks of `head`, in the shape `gh pr view --json statusCheckRollup` gives. */
  rollup: Record<string, unknown>[] = [];

  /**
   * The required checks: a list of `{name, workflow}`, or undefined for "no
   * required checks reported", or a `GhResult` to answer with instead.
   */
  required: Record<string, unknown>[] | GhResult | undefined;

  /** When set, every call fails with it. */
  failure: GhResult | undefined;

  /**
   * Heads to report, one per call, when only the head is asked for; used
   * to move the head in the middle of a read. Empty means `head`.
   */
  readonly headsOnRecheck: string[] = [];

  /** Every argument list it was run with. */
  readonly calls: string[][] = [];

  static checkRun(
    name: string,
    {
      status = 'COMPLETED',
      conclusion = '',
      workflow = 'CI',
      startedAt = '2026-10-11T10:00:00Z',
      job = 1,
    }: { status?: string; conclusion?: string; workflow?: string; startedAt?: string; job?: number } = {},
  ): Record<string, unknown> {
    return {
      __typename: 'CheckRun',
      name,
      workflowName: workflow,
      status,
      conclusion,
      detailsUrl: `https://github.example/octo/app/actions/runs/7/job/${job}`,
      startedAt,
      completedAt: status === 'COMPLETED' ? '2026-10-11T10:05:00Z' : '0001-01-01T00:00:00Z',
    };
  }

  static status(context: string, state: string): Record<string, unknown> {
    return { __typename: 'StatusContext', context, state, targetUrl: `https://ci.example/${context}` };
  }

  async run(args: readonly string[]): Promise<GhResult> {
    this.calls.push([...args]);
    if (this.failure !== undefined) return this.failure;
    if (args.slice(0, 2).join(' ') === 'repo view') {
      return { exitCode: 0, stdout: JSON.stringify({ nameWithOwner: this.repository }), stderr: '' };
    }
    if (args.slice(0, 2).join(' ') === 'pr view') {
      const fields = args.at(-1);
      if (fields === 'headRefOid') {
        const reported = this.headsOnRecheck.length === 0 ? this.head : this.headsOnRecheck.shift()!;
        // A head that moved stays moved.
        this.head = reported;
        return { exitCode: 0, stdout: JSON.stringify({ headRefOid: reported }), stderr: '' };
      }
      return {
        exitCode: 0,
        stdout: JSON.stringify({
          number: Number(args[2]),
          state: this.prState,
          headRefOid: this.head,
          isDraft: false,
          mergeable: this.mergeable,
          mergeStateStatus: this.mergeStateStatus,
          url: `https://github.example/octo/app/pull/${args[2]}`,
          statusCheckRollup: this.rollup,
        }),
        stderr: '',
      };
    }
    if (args.slice(0, 2).join(' ') === 'pr checks') {
      const answer = this.required;
      if (answer !== undefined && !Array.isArray(answer)) return answer;
      if (answer === undefined) {
        return { exitCode: 1, stdout: '', stderr: "no required checks reported on the 'feature' branch" };
      }
      // gh exits 8 while required checks are pending; the list still prints.
      return { exitCode: 8, stdout: JSON.stringify(answer), stderr: '' };
    }
    return { exitCode: 2, stdout: '', stderr: `unexpected: ${args.join(' ')}` };
  }
}
