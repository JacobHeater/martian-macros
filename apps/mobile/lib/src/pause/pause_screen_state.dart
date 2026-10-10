import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

import '../format/fmt.dart';
import '../format/pause_reason_label.dart';
import '../providers.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/mm_slider.dart';
import '../ui/notice.dart';
import '../ui/section_label.dart';
import 'pause_controller_provider.dart';
import 'pause_screen.dart';

class PauseScreenState extends ConsumerState<PauseScreen> {
  PauseReason _reason = PauseReason.travel;
  int _startsIn = 0;
  int _days = 7;

  @override
  Widget build(BuildContext context) {
    final today = ref.watch(todayProvider);
    final pauses = ref.watch(pausesProvider).value ?? const <Pause>[];
    // The pause that is running, or the next one that is set.
    final current = pauses.where((p) => !p.to.isBefore(today)).firstOrNull;
    return Scaffold(
      appBar: const MmAppBar(title: 'Pause'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: current == null
            ? _form(context, today, pauses)
            : _current(context, today, current),
      ),
    );
  }

  List<Widget> _current(BuildContext context, CalendarDate today, Pause pause) {
    final text = Theme.of(context).textTheme;
    final running = pause.covers(today);
    final controller = ref.read(pauseControllerProvider);
    return [
      Text(
        running
            ? 'Paused until ${Fmt.day(pause.to, today)}'
            : 'Pause set for ${Fmt.shortDay(pause.from)} to '
                  '${Fmt.shortDay(pause.to)}',
        key: const ValueKey('pause-current'),
        style: text.headlineSmall,
      ),
      const SizedBox(height: 4),
      Text(
        '${pause.reason.label} · ${pause.days} '
        '${pause.days == 1 ? 'day' : 'days'}',
        style: text.bodyMedium?.copyWith(color: context.mm.text2),
      ),
      const SizedBox(height: 16),
      Text(_whatItDoes, style: text.bodyMedium),
      const SizedBox(height: 24),
      MmButton(
        key: const ValueKey('pause-end'),
        label: running ? 'Resume now' : 'Cancel this pause',
        expand: true,
        onPressed: () async {
          await controller.endNow(pause, today);
          // Resuming shows the resume screen, which is under every pushed
          // one.
          if (context.mounted) {
            Navigator.of(context).popUntil((route) => route.isFirst);
          }
        },
      ),
      const SizedBox(height: 8),
      MmButton(
        key: const ValueKey('pause-extend'),
        label: 'Extend by a week',
        kind: MmButtonKind.secondary,
        expand: true,
        onPressed: pause.extended ? null : () => controller.extend(pause),
      ),
      if (pause.extended)
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            'A pause can be extended once. For anything longer, changing the '
            'goal to maintenance on the Coach screen is the better tool.',
            style: text.bodySmall?.copyWith(color: context.mm.text2),
          ),
        ),
    ];
  }

  List<Widget> _form(
    BuildContext context,
    CalendarDate today,
    List<Pause> pauses,
  ) {
    final text = Theme.of(context).textTheme;
    final from = today.addDays(_startsIn);
    final pause = Pause(
      from: from,
      to: from.addDays(_days - 1),
      reason: _reason,
    );
    final recentlyPaused = pausedDaysBetween(
      [...pauses, pause],
      pause.to.addDays(1 - PauseRule.heavyUseWindowDays),
      pause.to,
    );
    return [
      Text(
        'A holiday, an illness, an injury: some weeks are not going to be '
        'tracked. Say so and the coach waits for you.',
        style: text.bodyLarge,
      ),
      const SizedBox(height: 24),
      const SectionLabel('Reason'),
      const SizedBox(height: 8),
      MmSegmented<PauseReason>(
        compact: true,
        segments: [for (final r in PauseReason.values) MmSegment(r, r.label)],
        selected: {_reason},
        onChanged: (s) => setState(() => _reason = s.first),
      ),
      const SizedBox(height: 24),
      SectionLabel('Starts: ${Fmt.day(from, today)}'),
      MmSlider(
        key: const ValueKey('pause-starts'),
        value: _startsIn.toDouble(),
        max: PauseRule.maximumDays.toDouble(),
        divisions: PauseRule.maximumDays,
        onChanged: (v) => setState(() => _startsIn = v.round()),
      ),
      const SizedBox(height: 8),
      SectionLabel(
        'Lasts: $_days ${_days == 1 ? 'day' : 'days'}, through '
        '${Fmt.day(pause.to, today)}',
      ),
      MmSlider(
        key: const ValueKey('pause-days'),
        value: _days.toDouble(),
        min: 1,
        max: PauseRule.maximumDays.toDouble(),
        divisions: PauseRule.maximumDays - 1,
        onChanged: (v) => setState(() => _days = v.round()),
      ),
      const SizedBox(height: 16),
      Text(_whatItDoes, style: text.bodyMedium),
      if (recentlyPaused > PauseRule.heavyUseDays) ...[
        const SizedBox(height: 16),
        const Notice(
          key: ValueKey('pause-heavy-use'),
          text:
              'That makes a lot of paused days lately. Would maintenance suit '
              'better as the goal for now? You can change it on the Coach '
              'screen. Pausing is fine too.',
        ),
      ],
      const SizedBox(height: 24),
      MmButton(
        key: const ValueKey('pause-start'),
        label: _startsIn == 0 ? 'Pause from today' : 'Set this pause',
        expand: true,
        onPressed: () => ref.read(pauseControllerProvider).start(pause),
      ),
    ];
  }

  static const _whatItDoes =
      'While paused, your targets become a maintenance guide and nothing is '
      'judged against them. No check-in runs and no target changes. Logging '
      'and weigh-ins still work and are welcome, never asked for. A pause of '
      'a week or more counts as a break from the deficit.';
}
