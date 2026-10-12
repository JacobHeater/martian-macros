/** Something was asked of an object in a state that cannot answer. Dart's StateError. */
export class StateError extends Error {
  override readonly name = 'StateError';
}
