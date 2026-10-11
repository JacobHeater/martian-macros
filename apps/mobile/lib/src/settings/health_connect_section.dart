import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';

import '../format/health_data_type_label.dart';
import '../health/health_connection_provider.dart';
import '../health/health_sync_provider.dart';
import '../integration_providers.dart';
import '../providers.dart';
import '../ui/group_header.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_list_group.dart';
import '../ui/mm_list_row.dart';
import '../ui/show_mm_snack_bar.dart';

/// The Health Connect group of Settings (MM-68). Connecting is offered,
/// never required: each kind of reading is allowed by itself, with what it
/// is for, and refusing one does not block the others. The app only reads.
///
/// Rows are keyed `health-<type name>`, the button `health-import`.
class HealthConnectSection extends ConsumerWidget {
  const HealthConnectSection({super.key});

  static String _count(List<HealthSample> samples) {
    if (samples.isEmpty) return 'Allowed. Nothing to read yet.';
    final sources = {for (final sample in samples) sample.sourceName};
    final readings = samples.length == 1
        ? '1 reading'
        : '${samples.length} readings';
    return 'Allowed. $readings from ${sources.join(', ')}.';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connection = ref.watch(healthConnectionProvider).value;
    final setup = ref.watch(setupProvider).value;
    if (connection == null || setup == null) return const SizedBox.shrink();
    final text = Theme.of(context).textTheme;
    final messenger = ScaffoldMessenger.of(context);

    if (connection.available.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const GroupHeader('Health Connect'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Health Connect is not on this phone, so there is nothing to '
              'connect. Everything in the app works without it.',
              key: const ValueKey('health-absent'),
              style: text.bodyMedium,
            ),
          ),
        ],
      );
    }

    /// Reads every allowed kind. A platform that cannot be read just now
    /// leaves what is kept as it was, and says so.
    Future<void> import() async {
      if (!await ref.read(healthSyncProvider)()) {
        showMmSnackBar(
          messenger,
          'Health Connect could not be read just now. Nothing was changed.',
        );
      }
    }

    Future<void> allow(HealthDataType type) async {
      final after = await ref.read(healthSourceProvider).requestPermission({
        type,
      });
      ref.invalidate(healthConnectionProvider);
      if (after.contains(type)) {
        await import();
      } else {
        showMmSnackBar(
          messenger,
          '${type.label} was not allowed. You can allow it here, or in '
          'Health Connect, whenever you like.',
        );
      }
    }

    final offered = [
      for (final type in HealthDataType.values)
        if (connection.available.contains(type) &&
            // Asked for only where it applies (MM-68).
            (type != HealthDataType.menstruation ||
                setup.profile.sex == BiologicalSex.female))
          type,
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const GroupHeader('Health Connect'),
        MmListGroup(
          children: [
            for (final type in offered)
              MmListRow(
                key: ValueKey('health-${type.name}'),
                title: type.label,
                subtitle: connection.permitted.contains(type)
                    ? _count(connection.imported[type] ?? const [])
                    : 'Not allowed. ${type.purpose}',
                trailing: connection.permitted.contains(type)
                    ? const Icon(Icons.check, semanticLabel: 'Allowed')
                    : const Icon(Icons.chevron_right),
                onTap: connection.permitted.contains(type)
                    ? null
                    : () => allow(type),
              ),
          ],
        ),
        if (connection.permitted.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: MmButton(
              key: const ValueKey('health-import'),
              label: 'Read from Health Connect now',
              kind: MmButtonKind.secondary,
              expand: true,
              onPressed: import,
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Text(
            'The app only reads. Nothing is written to your health data, '
            'and nothing read leaves this phone. One weigh-in counts for a '
            'day: the first of the morning, or the middle of the day’s '
            'readings. A value you type for a day is used instead. To stop, '
            'take the permission away in Health Connect: what was read is '
            'kept until you erase your data.',
            style: text.bodySmall,
          ),
        ),
      ],
    );
  }
}
