import 'package:mm_domain/mm_domain.dart';

/// [DataEraser] that runs a set of clear callbacks.
final class InMemoryDataEraser implements DataEraser {
  InMemoryDataEraser(this._clears);

  final List<void Function()> _clears;

  @override
  Future<void> eraseAll() async {
    for (final clear in _clears) {
      clear();
    }
  }
}
