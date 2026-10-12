/**
 * A request to the watch that could not be done, with what to do instead.
 * `code` is stable, for an agent to branch on: `noSuchWatch`, `notOwner`,
 * `watcherRunning`, `unreadEvents`, `badRequest`, `incompatibleState` or
 * `github`.
 */
export class CiWatchError extends Error {
  override readonly name = 'CiWatchError';
  readonly code: string;
  readonly action: string | undefined;

  constructor(code: string, message: string, action?: string) {
    super(message);
    this.code = code;
    this.action = action;
  }

  toJson(): Record<string, unknown> {
    return { code: this.code, message: this.message, action: this.action ?? null };
  }
}
