import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/info_card.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_icon_button.dart';
import '../ui/mm_list_row.dart';
import '../ui/show_mm_snack_bar.dart';
import 'weight_event_entry_sheet.dart';
import 'weight_event_label.dart';

class WeightEventsCard extends ConsumerWidget {
  const WeightEventsCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(weightEventsProvider);
    final setup = ref.watch(setupProvider).value;
    final today = ref.watch(todayProvider);
    return InfoCard(
      title: 'Weight events',
      trailing: MmButton(
        label: 'Add',
        kind: MmButtonKind.secondary,
        icon: Icons.add,
        onPressed: () => showModalBottomSheet<void>(
          context: context,
          isScrollControlled: true,
          builder: (_) => WeightEventEntrySheet(today: today),
        ),
      ),
      child: events.when(
        data: (items) => _events(items, setup, context, ref),
        error: (error, _) => Text('Could not load weight events: $error'),
        loading: () => const Text('Loading weight events...'),
      ),
    );
  }

  Widget _events(
    List<WeightEvent> events,
    UserSetup? setup,
    BuildContext context,
    WidgetRef ref,
  ) {
    final allEvents = [...events];
    final creatineStartedOn = setup?.creatineStartedOn;
    if (creatineStartedOn != null &&
        !events.any(
          (event) =>
              event.date == creatineStartedOn &&
              event.type == WeightEventType.startedCreatine,
        )) {
      allEvents.add(
        WeightEvent(
          date: creatineStartedOn,
          type: WeightEventType.startedCreatine,
        ),
      );
    }
    allEvents.sort((a, b) {
      final byDate = a.date.compareTo(b.date);
      return byDate != 0 ? byDate : a.type.index.compareTo(b.type.index);
    });
    if (allEvents.isEmpty) {
      return const Text(
        'Note illness, travel, training changes, meals, or creatine '
        'to help separate water changes from tissue change. '
        'If you start or stop creatine later, add an event here.',
      );
    }
    final effective = effectiveWeightEvents(events);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('If you start or stop creatine later, add an event here.'),
        for (final event in allEvents.reversed)
          MmListRow(
            title: '${event.date} · ${weightEventLabel(event.type)}',
            subtitle: switch (event.type) {
              WeightEventType.startedCreatine ||
              WeightEventType.stoppedCreatine =>
                'Creatine shift estimated across 21 days.',
              _
                  when effective.any(
                    (active) =>
                        active.date == event.date && active.type == event.type,
                  ) =>
                'Scale noise widened around this event.',
              _ =>
                'Recorded only; two other events in this 14-day '
                    'window already affect the trend.',
            },
            trailing: _isOnboardingCreatine(event, events, setup)
                ? const Text('Onboarding')
                : MmIconButton(
                    tooltip:
                        'Delete ${weightEventLabel(event.type).toLowerCase()} event',
                    icon: Icons.delete_outline,
                    onPressed: () => _delete(event, context, ref),
                  ),
          ),
      ],
    );
  }

  bool _isOnboardingCreatine(
    WeightEvent event,
    List<WeightEvent> stored,
    UserSetup? setup,
  ) =>
      event.type == WeightEventType.startedCreatine &&
      event.date == setup?.creatineStartedOn &&
      !stored.any(
        (existing) =>
            existing.date == event.date && existing.type == event.type,
      );

  Future<void> _delete(
    WeightEvent event,
    BuildContext context,
    WidgetRef ref,
  ) async {
    try {
      await ref.read(weightEventWriterProvider).deleteWeightEvent(event);
    } catch (error, stackTrace) {
      FlutterError.reportError(
        FlutterErrorDetails(
          exception: error,
          stack: stackTrace,
          library: 'weight events',
          context: ErrorDescription('while deleting a weight event'),
        ),
      );
      if (context.mounted) {
        showMmSnackBar(
          ScaffoldMessenger.of(context),
          'Could not delete the weight event. Please try again.',
        );
      }
    }
  }
}
