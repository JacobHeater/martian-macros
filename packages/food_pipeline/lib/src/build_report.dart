import 'drop_reason.dart';

/// Counts for one build: what each source gave, what was dropped and why, and
/// what was written. Every entry read is either written or dropped, once.
final class BuildReport {
  final Map<String, int> read = {};
  final Map<String, Map<DropReason, int>> dropped = {};
  final Map<String, int> written = {};

  void countRead(String source) => read[source] = (read[source] ?? 0) + 1;

  void countDropped(String source, DropReason reason) {
    final bySource = dropped.putIfAbsent(source, () => {});
    bySource[reason] = (bySource[reason] ?? 0) + 1;
  }

  /// A food written to a pack came from [source].
  void countWritten(String source) =>
      written[source] = (written[source] ?? 0) + 1;

  int get totalRead => read.values.fold(0, (a, b) => a + b);
  int get totalWritten => written.values.fold(0, (a, b) => a + b);
  int get totalDropped => dropped.values
      .expand((byReason) => byReason.values)
      .fold(0, (a, b) => a + b);

  /// Entries read equal entries written plus entries dropped.
  bool get reconciles => totalRead == totalWritten + totalDropped;

  String format() {
    final out = StringBuffer();
    for (final source in read.keys.toList()..sort()) {
      out.writeln(
        '$source: read ${read[source]}, written ${written[source] ?? 0}, '
        'dropped ${(dropped[source] ?? {}).values.fold(0, (a, b) => a + b)}',
      );
      final reasons = (dropped[source] ?? {}).entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));
      for (final reason in reasons) {
        out.writeln('    ${reason.key.name}: ${reason.value}');
      }
    }
    out.writeln(
      'total: read $totalRead, written $totalWritten, dropped $totalDropped'
      '${reconciles ? '' : '  (DOES NOT RECONCILE)'}',
    );
    return out.toString();
  }
}
