import type { PackDownloadProblem } from './PackDownloadProblem';

/**
 * A download that stopped for `problem`. The installed pack, if any, is
 * untouched.
 */
export class PackDownloadFailed extends Error {
  override readonly name = 'PackDownloadFailed';
  readonly problem: PackDownloadProblem;
  readonly detail: string | undefined;

  constructor(problem: PackDownloadProblem, detail?: string) {
    super(`PackDownloadFailed(${problem}${detail === undefined ? '' : `: ${detail}`})`);
    this.problem = problem;
    this.detail = detail;
  }
}
