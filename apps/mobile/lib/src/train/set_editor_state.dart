import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/clock_time_text.dart';
import '../format/load_number.dart';
import '../format/parse_number.dart';
import '../format/set_text.dart';
import '../format/time_span_problem_text.dart';
import '../theme/mm_colors_context.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_icon_button.dart';
import '../ui/mm_list_row.dart';
import '../ui/mm_segment.dart';
import '../ui/mm_segmented.dart';
import '../ui/mm_text_field.dart';
import '../ui/mm_text_field_kind.dart';
import '../ui/show_mm_snack_bar.dart';
import '../ui/show_mm_time_picker.dart';
import 'set_editor.dart';

class SetEditorState extends State<SetEditor> {
  /// The set as edited here. While the controls are open this is the truth:
  /// two quick taps must not lose the first to a save that has not come back
  /// yet.
  late WorkoutSet _set = widget.set;

  void _change(WorkoutSet set) {
    setState(() => _set = set);
    widget.onChanged(set);
  }

  // A new set with nothing in it yet starts with empty fields, so the first
  // number is typed without clearing a zero.
  late final _reps = TextEditingController(
    text: widget.set.reps == 0 ? '' : '${widget.set.reps}',
  );
  late final _load = TextEditingController(
    text: widget.set.loadKg == 0 ? '' : _loadText(widget.set),
  );

  /// One plate change: 5 lb, or 2.5 kg.
  double get _loadStep => widget.fmt.imperial ? 5 : 2.5;

  String _loadText(WorkoutSet set) =>
      loadNumber(widget.fmt.weightFromKg(set.loadKg));

  @override
  void dispose() {
    _reps.dispose();
    _load.dispose();
    super.dispose();
  }

  void _typedReps(String text) {
    final reps = int.tryParse(text.trim());
    if (reps == null || reps < 0) return;
    _change(_set.copyWith(reps: reps));
  }

  void _typedLoad(String text) {
    final value = parseNumber(text);
    if (value == null) return;
    _change(_set.copyWith(loadKg: widget.fmt.weightToKg(value)));
  }

  void _stepReps(int by) {
    final reps = (_set.reps + by).clamp(0, 999);
    _reps.text = '$reps';
    _change(_set.copyWith(reps: reps));
  }

  void _stepLoad(double by) {
    var value = (parseNumber(_load.text) ?? 0) + by;
    // Only a bodyweight exercise goes below zero (assisted work).
    if (widget.load == ExerciseLoad.addedWeight && value < 0) value = 0;
    _load.text = loadNumber(value);
    _change(_set.copyWith(loadKg: widget.fmt.weightToKg(value)));
  }

  static String _timeText(DateTime? time) =>
      time == null ? 'Not timed' : clockTimeText(time);

  /// Sets the start or the end by hand, to the minute. A time that cannot
  /// be right is refused with the reason.
  Future<void> _pickTime({required bool start}) async {
    final current = start ? _set.startedAt : _set.endedAt;
    final opensAt = current ?? _set.endedAt ?? widget.timeBase;
    final messenger = ScaffoldMessenger.of(context);
    final minutes = await showMmTimePicker(
      context,
      initialMinuteOfDay: opensAt.hour * 60 + opensAt.minute,
      helpText: start ? 'Set started' : 'Set ended',
    );
    if (minutes == null || !mounted) return;
    final base = widget.timeBase;
    final picked = DateTime(
      base.year,
      base.month,
      base.day,
    ).add(Duration(minutes: minutes));
    final changed = start
        ? _set.copyWith(startedAt: () => picked)
        : _set.copyWith(endedAt: () => picked);
    final problem = widget.checkTimes(changed.startedAt, changed.endedAt);
    if (problem != null) {
      showMmSnackBar(messenger, problem.message);
      return;
    }
    _change(changed);
  }

  @override
  Widget build(BuildContext context) {
    final prefix = widget.keyPrefix;
    final unit = widget.fmt.weightUnit;
    final bodyweight = widget.load == ExerciseLoad.bodyweight;
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Set ${widget.number}', style: text.titleSmall),
          const SizedBox(height: 8),
          _stepper(
            label: 'Reps',
            field: MmTextField(
              key: ValueKey('$prefix-reps'),
              controller: _reps,
              label: 'Reps',
              kind: MmTextFieldKind.number,
              dense: true,
              onChanged: _typedReps,
            ),
            minusKey: '$prefix-reps-minus',
            plusKey: '$prefix-reps-plus',
            onMinus: () => _stepReps(-1),
            onPlus: () => _stepReps(1),
          ),
          const SizedBox(height: 12),
          _stepper(
            label: bodyweight ? 'Added weight' : 'Load',
            field: MmTextField(
              key: ValueKey('$prefix-load'),
              controller: _load,
              label: bodyweight ? 'Added weight' : 'Load',
              suffix: unit,
              helper: bodyweight ? 'Below zero for assisted work' : null,
              kind: MmTextFieldKind.number,
              dense: true,
              onChanged: _typedLoad,
            ),
            minusKey: '$prefix-load-minus',
            plusKey: '$prefix-load-plus',
            onMinus: () => _stepLoad(-_loadStep),
            onPlus: () => _stepLoad(_loadStep),
          ),
          const SizedBox(height: 12),
          Text(
            'Reps in reserve (optional)',
            style: text.bodySmall?.copyWith(color: context.mm.text2),
          ),
          const SizedBox(height: 4),
          MmSegmented<int>(
            key: ValueKey('$prefix-rir'),
            compact: true,
            allowEmpty: true,
            segments: [
              for (var rir = 0; rir <= WorkoutSet.maxRir; rir++)
                MmSegment(rir, rirText(rir)),
            ],
            selected: {?_set.rir},
            // Tapping the chosen one again clears it.
            onChanged: (chosen) =>
                _change(_set.copyWith(rir: () => chosen.firstOrNull)),
          ),
          const SizedBox(height: 8),
          MmListRow(
            key: ValueKey('$prefix-start'),
            dense: true,
            title: 'Started',
            subtitle: _timeText(_set.startedAt),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _pickTime(start: true),
          ),
          MmListRow(
            key: ValueKey('$prefix-end'),
            dense: true,
            title: 'Ended',
            subtitle: _timeText(_set.endedAt),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _pickTime(start: false),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: MmButton(
              key: ValueKey('$prefix-remove'),
              label: 'Remove set',
              kind: MmButtonKind.text,
              onPressed: widget.onRemove,
            ),
          ),
        ],
      ),
    );
  }

  Widget _stepper({
    required String label,
    required Widget field,
    required String minusKey,
    required String plusKey,
    required VoidCallback onMinus,
    required VoidCallback onPlus,
  }) => Row(
    children: [
      MmIconButton(
        key: ValueKey(minusKey),
        icon: Icons.remove,
        tooltip: 'Less: $label',
        onPressed: onMinus,
      ),
      const SizedBox(width: 8),
      Expanded(child: field),
      const SizedBox(width: 8),
      MmIconButton(
        key: ValueKey(plusKey),
        icon: Icons.add,
        tooltip: 'More: $label',
        onPressed: onPlus,
      ),
    ],
  );
}
