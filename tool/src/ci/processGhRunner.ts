import { capture } from '../proc.ts';
import type { GhResult } from './ghResult.ts';
import type { GhRunner } from './ghRunner.ts';

/**
 * `GhRunner` over the installed `gh`, using its own stored login. Arguments
 * are passed as a list, never interpolated into a shell line by hand, so
 * nothing read from GitHub can be interpreted as a command.
 */
export class ProcessGhRunner implements GhRunner {
  private readonly timeoutMs: number;

  constructor({ timeoutMs = 30_000 }: { timeoutMs?: number } = {}) {
    this.timeoutMs = timeoutMs;
  }

  async run(args: readonly string[]): Promise<GhResult> {
    const result = await capture(['gh', ...args], {
      timeoutMs: this.timeoutMs,
      // Never prompt: a watch has nobody to answer.
      env: { ...process.env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1' },
    });
    return { exitCode: result.code, stdout: result.stdout, stderr: result.stderr };
  }
}
