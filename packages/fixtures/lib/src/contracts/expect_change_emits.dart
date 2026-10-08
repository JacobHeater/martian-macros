import 'dart:async';

import 'package:test/test.dart';

/// Subscribes to [stream], waits for its first emission (which must equal
/// [before]), runs [change], and expects the stream to then emit [after].
///
/// Waiting for the first emission matters: a database may run its first query
/// after a write issued straight after subscribing, so "the current value
/// first" can only be checked once that value has arrived.
Future<void> expectChangeEmits<T>(
  Stream<T> stream, {
  required T before,
  required Future<void> Function() change,
  required T after,
}) async {
  final seen = <T>[];
  final first = Completer<void>();
  final subscription = stream.listen((value) {
    seen.add(value);
    if (!first.isCompleted) first.complete();
  });
  await first.future.timeout(const Duration(seconds: 5));
  expect(seen.first, before, reason: 'the first emission is the current value');
  await change();
  for (var i = 0; i < 100 && (seen.length < 2 || seen.last != after); i++) {
    await pumpEventQueue();
  }
  await subscription.cancel();
  expect(seen.last, after, reason: 'a change is emitted');
}
