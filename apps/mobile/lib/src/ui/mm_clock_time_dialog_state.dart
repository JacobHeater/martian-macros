import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import 'mm_button.dart';
import 'mm_button_kind.dart';
import 'mm_clock_time_dialog.dart';
import 'mm_segment.dart';
import 'mm_segmented.dart';
import 'mm_text_field.dart';
import 'mm_text_field_kind.dart';

class MmClockTimeDialogState extends State<MmClockTimeDialog> {
  late final int _initialHour = widget.initial.inHours % 24;
  late final _hour = TextEditingController(
    text: '${_initialHour % 12 == 0 ? 12 : _initialHour % 12}',
  );
  late final _minute = TextEditingController(
    text: _two(widget.initial.inMinutes % 60),
  );
  late final _second = TextEditingController(
    text: _two(widget.initial.inSeconds % 60),
  );
  late bool _pm = _initialHour >= 12;
  String? _error;

  static String _two(int n) => n.toString().padLeft(2, '0');

  @override
  void dispose() {
    _hour.dispose();
    _minute.dispose();
    _second.dispose();
    super.dispose();
  }

  void _confirm() {
    final hour = int.tryParse(_hour.text.trim());
    final minute = int.tryParse(_minute.text.trim());
    // An empty seconds field is the top of the minute.
    final second = _second.text.trim().isEmpty
        ? 0
        : int.tryParse(_second.text.trim());
    if (hour == null || hour < 1 || hour > 12) {
      return setState(() => _error = 'The hour is from 1 to 12.');
    }
    if (minute == null || minute < 0 || minute > 59) {
      return setState(() => _error = 'The minute is from 0 to 59.');
    }
    if (second == null || second < 0 || second > 59) {
      return setState(() => _error = 'The second is from 0 to 59.');
    }
    Navigator.of(context).pop(
      Duration(
        hours: hour % 12 + (_pm ? 12 : 0),
        minutes: minute,
        seconds: second,
      ),
    );
  }

  Widget _field(String key, String label, TextEditingController controller) =>
      Expanded(
        child: MmTextField(
          key: ValueKey(key),
          controller: controller,
          label: label,
          kind: MmTextFieldKind.number,
          dense: true,
        ),
      );

  @override
  Widget build(BuildContext context) {
    final error = _error;
    return AlertDialog(
      title: Text(widget.title),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _field('clock-hour', 'Hour', _hour),
                const SizedBox(width: 8),
                _field('clock-minute', 'Minute', _minute),
                const SizedBox(width: 8),
                _field('clock-second', 'Second', _second),
              ],
            ),
            const SizedBox(height: 12),
            MmSegmented<bool>(
              key: const ValueKey('clock-period'),
              segments: const [MmSegment(false, 'AM'), MmSegment(true, 'PM')],
              selected: {_pm},
              onChanged: (chosen) => setState(() => _pm = chosen.first),
            ),
            if (error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Semantics(
                  liveRegion: true,
                  child: Text(
                    error,
                    key: const ValueKey('clock-error'),
                    style: Theme.of(context).textTheme.bodySmall
                        ?.copyWith(color: context.mm.danger),
                  ),
                ),
              ),
          ],
        ),
      ),
      actions: [
        MmButton(
          key: const ValueKey('clock-cancel'),
          label: 'Cancel',
          kind: MmButtonKind.text,
          onPressed: () => Navigator.of(context).pop(),
        ),
        MmButton(
          key: const ValueKey('clock-ok'),
          label: 'OK',
          onPressed: _confirm,
        ),
      ],
    );
  }
}
