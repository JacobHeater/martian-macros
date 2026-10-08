import 'dart:async';

/// A value that can be read now and watched. Watching emits the current value
/// first and then every change, like a database query stream.
final class ObservableValue<T> {
  ObservableValue(this._value);

  T _value;
  final _changes = StreamController<T>.broadcast();

  T get value => _value;

  set value(T next) {
    _value = next;
    _changes.add(next);
  }

  Stream<T> watch() => Stream<T>.multi((controller) {
    controller.add(_value);
    final subscription = _changes.stream.listen(controller.add);
    controller.onCancel = subscription.cancel;
  });
}
