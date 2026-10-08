part of 'outcome.dart';

/// The provider answered with [value].
final class Succeeded<T> extends Outcome<T> {
  const Succeeded(this.value);

  final T value;
}
