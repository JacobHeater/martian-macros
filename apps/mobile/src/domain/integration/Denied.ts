/**
 * The provider refused: a permission the user declined, or an account that
 * is not signed in. Retrying will not help until something changes.
 */
export class Denied {
  readonly kind = 'denied';
  readonly message: string;

  constructor(message: string) {
    this.message = message;
  }
}
