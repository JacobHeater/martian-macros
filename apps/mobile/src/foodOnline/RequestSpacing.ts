/**
 * Keeps requests to one service at least `spacingMs` apart (MM-58), as its
 * rate limit asks: a request made too soon waits its turn. The clock is
 * given so a test can run without waiting.
 */
export class RequestSpacing {
  private readonly spacingMs: number;
  private readonly now: () => number;
  private readonly wait: (ms: number) => Promise<void>;
  private last = Number.NEGATIVE_INFINITY;

  constructor(
    spacingMs: number,
    {
      now = () => Date.now(),
      wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    }: { now?: () => number; wait?: (ms: number) => Promise<void> } = {},
  ) {
    this.spacingMs = spacingMs;
    this.now = now;
    this.wait = wait;
  }

  /** Resolves when the next request may go, and counts it as made. */
  async turn(): Promise<void> {
    const due = this.last + this.spacingMs;
    const now = this.now();
    if (now < due) await this.wait(due - now);
    this.last = Math.max(this.now(), due);
  }
}
