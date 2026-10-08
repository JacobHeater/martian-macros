part of 'outcome.dart';

/// The provider refused: a permission the user declined, or an account that
/// is not signed in. Retrying will not help until something changes.
final class Denied<T> extends Outcome<T> {
  const Denied(this.message);

  final String message;
}
