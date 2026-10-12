/** The provider answered with `value`. */
export class Succeeded<T> {
  readonly kind = 'succeeded';
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }
}
