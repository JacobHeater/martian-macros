import 'pr_snapshot.dart';
import 'watch_event.dart';

/// The meaningful changes from [before] to [after], oldest first; empty when
/// nothing changed. Ids are assigned by the store.
///
/// A new head commit voids everything known about the old one: its checks
/// are not compared, and the summary change says the old result no longer
/// applies.
List<WatchEvent> diffSnapshots(PrSnapshot? before, PrSnapshot after) {
  final at = after.observedAt;
  final head = after.headSha;
  final events = <WatchEvent>[];
  WatchEvent event(
    String type, {
    String? check,
    String? from,
    String? to,
    Map<String, Object?> detail = const {},
  }) => WatchEvent(
    id: 0,
    type: type,
    at: at,
    headSha: head,
    check: check,
    from: from,
    to: to,
    detail: detail,
  );

  final newHead = before != null && before.headSha != after.headSha;
  if (newHead) {
    events.add(
      event(
        'headChanged',
        from: before.headSha,
        to: head,
        detail: {
          'note':
              'Results for the old commit no longer apply to this pull '
              'request.',
          'previousCiSummary': before.ciSummary.name,
        },
      ),
    );
  }
  // Compare checks only within one commit.
  final same = newHead ? null : before;

  if (before != null && before.prState != after.prState) {
    events.add(
      event('prStateChanged', from: before.prState, to: after.prState),
    );
  }
  for (final check in after.checks) {
    final was = same?.stateOf(check.key);
    if (was == check.state) continue;
    events.add(
      event(
        'checkChanged',
        check: check.key,
        from: was?.name,
        to: check.state.name,
        detail: {
          'name': check.name,
          'workflow': ?check.workflow,
          'required': check.required,
          'providerStatus': ?check.providerStatus,
          'providerConclusion': ?check.providerConclusion,
          'url': ?check.url,
          'startedAt': ?check.startedAt,
          'completedAt': ?check.completedAt,
        },
      ),
    );
  }
  if (same != null) {
    final present = {for (final check in after.checks) check.key};
    for (final gone in same.checks) {
      if (!present.contains(gone.key)) {
        events.add(
          event('checkChanged', check: gone.key, from: gone.state.name),
        );
      }
    }
  }
  if (before == null || newHead || before.ciSummary != after.ciSummary) {
    events.add(
      event(
        'ciSummaryChanged',
        from: before?.ciSummary.name,
        to: after.ciSummary.name,
        detail: {
          'counts': after.counts,
          'invalidatedByNewHead': ?(newHead ? true : null),
        },
      ),
    );
  }
  if (before?.requiredDiscovery != after.requiredDiscovery) {
    events.add(
      event(
        'requiredDiscoveryChanged',
        from: before?.requiredDiscovery.name,
        to: after.requiredDiscovery.name,
      ),
    );
  }
  if (newHead || before?.requiredSummary != after.requiredSummary) {
    if (before?.requiredSummary != null || after.requiredSummary != null) {
      events.add(
        event(
          'requiredSummaryChanged',
          from: before?.requiredSummary?.name,
          to: after.requiredSummary?.name,
        ),
      );
    }
  }
  return events;
}
