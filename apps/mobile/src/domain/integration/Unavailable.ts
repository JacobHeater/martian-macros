/**
 * The provider could not be reached or failed: offline, a service error, a
 * full disk. Retrying later may work.
 */
export class Unavailable {
  readonly kind = 'unavailable';
  readonly message: string;

  constructor(message: string) {
    this.message = message;
  }
}
