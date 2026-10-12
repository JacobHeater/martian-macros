/**
 * Why GitHub could not be read: `auth` (not logged in; retrying will not
 * help), `rateLimit`, `notFound` (the repository or pull request does not
 * exist, or cannot be seen), `headUnstable` (the head kept changing while
 * being read) or `other`.
 */
export type GhFailureKind = 'auth' | 'rateLimit' | 'notFound' | 'headUnstable' | 'other';

/**
 * GitHub could not be read. `message` is safe to store and show: it holds
 * no token and at most a short, single line of what `gh` said.
 */
export class GhFailure extends Error {
  override readonly name = 'GhFailure';
  readonly kind: GhFailureKind;

  constructor(kind: GhFailureKind, message: string) {
    super(message);
    this.kind = kind;
  }

  /** What to do about it. */
  get action(): string {
    switch (this.kind) {
      case 'auth':
        return 'Run "gh auth status", then "gh auth login".';
      case 'rateLimit':
        return 'Wait for the rate limit to reset; the watch backs off by itself.';
      case 'notFound':
        return 'Check the repository and pull request number.';
      case 'headUnstable':
        return 'Read again once pushes have stopped.';
      case 'other':
        return 'Check the network and "gh --version"; then retry.';
    }
  }
}
