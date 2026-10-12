import 'ci_watch.dart';
import 'gh_failure.dart';
import 'gh_failure_kind.dart';

/// Polls one watch until there is nothing more to see: the pull request is
/// merged or closed, it is asked to stop, it has run its allowed time, or
/// GitHub cannot be read and retrying is pointless or has gone on too long.
/// It never runs forever and never hurries GitHub.
final class WatchLoop {
  WatchLoop({
    required this.watch,
    required this.sleep,
    required this.now,
    this.pid,
    this.maxLifetime = const Duration(hours: 8),
    this.maxConsecutiveFailures = 8,
    this.maxBackoff = const Duration(minutes: 10),
  });

  final CiWatch watch;
  final Future<void> Function(Duration) sleep;
  final DateTime Function() now;
  final int? pid;
  final Duration maxLifetime;
  final int maxConsecutiveFailures;
  final Duration maxBackoff;

  /// Runs to the end and returns why it stopped.
  Future<String> run(String id) async {
    final interval = Duration(
      seconds: watch.store.watch(id)['intervalSeconds'] as int? ?? 60,
    );
    final started = now();
    var failures = 0;
    while (true) {
      if (watch.stopRequested(id)) return _end(id, 'stopRequested');
      if (now().difference(started) >= maxLifetime) {
        return _end(id, 'lifetimeReached');
      }
      var wait = interval;
      try {
        await watch.poll(id, pid: pid, heartbeat: true);
        failures = 0;
        if (watch.store.snapshot(id)?.open == false) {
          return _end(id, 'pullRequestNoLongerOpen');
        }
      } on GhFailure catch (failure) {
        failures++;
        if (CiWatch.fatal(failure)) {
          return _end(id, '${failure.kind.name}Error');
        }
        if (failures >= maxConsecutiveFailures) {
          return _end(id, 'tooManyFailures');
        }
        // Twice as long each time, and longer still when GitHub said to
        // slow down.
        final factor = 1 << (failures > 6 ? 6 : failures);
        wait = interval * factor;
        if (failure.kind == GhFailureKind.rateLimit) wait = maxBackoff;
        if (wait > maxBackoff) wait = maxBackoff;
      }
      // Sleep in short steps so a stop request is seen soon.
      var slept = Duration.zero;
      const step = Duration(seconds: 5);
      while (slept < wait) {
        if (watch.stopRequested(id)) return _end(id, 'stopRequested');
        final next = wait - slept < step ? wait - slept : step;
        await sleep(next);
        slept += next;
      }
    }
  }

  String _end(String id, String reason) {
    watch.markStopped(id, reason);
    return reason;
  }
}
