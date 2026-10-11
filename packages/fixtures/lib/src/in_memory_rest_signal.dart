import 'package:mm_domain/mm_domain.dart';

/// A [RestSignal] that only counts, for tests and the demo.
final class InMemoryRestSignal implements RestSignal {
  /// How many times a rest was signalled over.
  var signalled = 0;

  @override
  void restOver() => signalled++;
}
