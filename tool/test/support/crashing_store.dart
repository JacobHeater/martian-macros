import '../../src/ci/pr_snapshot.dart';
import '../../src/ci/watch_health.dart';
import '../../src/ci/watch_store.dart';

/// A store whose process dies after the events are written and before the
/// snapshot is.
final class CrashingStore extends WatchStore {
  CrashingStore(super.root);

  @override
  void saveState(
    String id, {
    PrSnapshot? snapshot,
    required WatchHealth health,
  }) => throw StateError('the process died here');
}
