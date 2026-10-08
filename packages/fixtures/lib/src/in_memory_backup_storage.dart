import 'dart:typed_data';

import 'package:mm_domain/mm_domain.dart';

/// A [BackupStorage] that keeps blobs in memory. Script it to fail with
/// [failWith] to test offline and denied paths.
final class InMemoryBackupStorage implements BackupStorage {
  final _blobs = <String, Uint8List>{};
  Outcome<Never>? _failure;

  void failWith(Outcome<Never> failure) => _failure = failure;

  void recover() => _failure = null;

  @override
  Future<Outcome<List<String>>> list() async {
    final failure = _failure;
    if (failure != null) return _failed(failure);
    return Succeeded(_blobs.keys.toList()..sort());
  }

  @override
  Future<Outcome<Uint8List>> get(String name) async {
    final failure = _failure;
    if (failure != null) return _failed(failure);
    final blob = _blobs[name];
    return blob == null
        ? const NotFound()
        : Succeeded(Uint8List.fromList(blob));
  }

  @override
  Future<Outcome<void>> put(String name, Uint8List bytes) async {
    final failure = _failure;
    if (failure != null) return _failed(failure);
    _blobs[name] = Uint8List.fromList(bytes);
    return const Succeeded(null);
  }

  @override
  Future<Outcome<void>> delete(String name) async {
    final failure = _failure;
    if (failure != null) return _failed(failure);
    _blobs.remove(name);
    return const Succeeded(null);
  }

  Outcome<T> _failed<T>(Outcome<Never> failure) => switch (failure) {
    Unavailable(:final message) => Unavailable<T>(message),
    Denied(:final message) => Denied<T>(message),
    _ => throw StateError('failWith needs an Unavailable or a Denied'),
  };
}
