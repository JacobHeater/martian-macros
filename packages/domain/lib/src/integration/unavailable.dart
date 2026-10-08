part of 'outcome.dart';

/// The provider could not be reached or failed: offline, a service error, a
/// full disk. Retrying later may work.
final class Unavailable<T> extends Outcome<T> {
  const Unavailable(this.message);

  final String message;
}
