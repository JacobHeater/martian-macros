import 'package:flutter/material.dart';

import '../format/parse_number.dart';
import '../theme/mm_colors_context.dart';
import '../ui/info_card.dart';
import '../ui/mm_button.dart';
import '../ui/mm_text_field.dart';
import '../ui/mm_text_field_kind.dart';
import '../ui/show_mm_snack_bar.dart';
import 'waist_entry_card.dart';

class WaistEntryCardState extends State<WaistEntryCard> {
  final _readings = [
    TextEditingController(),
    TextEditingController(),
    TextEditingController(),
  ];

  @override
  void dispose() {
    for (final controller in _readings) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _save(List<double> readings) async {
    final messenger = ScaffoldMessenger.of(context);
    FocusScope.of(context).unfocus();
    try {
      await widget.onSave(readings);
      for (final controller in _readings) {
        controller.clear();
      }
      if (mounted) setState(() {});
    } on Exception {
      showMmSnackBar(messenger, 'That value looks off. Check it.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    final typed = [
      for (final controller in _readings)
        if (controller.text.trim().isNotEmpty) parseNumber(controller.text),
    ];
    final valid = [
      for (final value in typed)
        if (value != null && value > 0) value,
    ];
    final ready =
        valid.length == typed.length &&
        (valid.length == 1 || valid.length == 3);
    final summary = widget.summary;
    return InfoCard(
      title: 'Waist',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              for (var i = 0; i < _readings.length; i++) ...[
                if (i > 0) const SizedBox(width: 8),
                Expanded(
                  child: MmTextField(
                    key: ValueKey(
                      i == 0 ? 'entry-waist' : 'entry-waist-${i + 1}',
                    ),
                    controller: _readings[i],
                    label: 'Reading ${i + 1}',
                    kind: MmTextFieldKind.number,
                    suffix: widget.unit,
                    dense: true,
                    onChanged: (_) => setState(() {}),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  typed.length == 2
                      ? 'Enter one reading or all three.'
                      : valid.length == 1 && typed.length == 1
                      ? 'One reading is kept as it is. It is noisier than '
                            'the middle of three, so a change takes longer '
                            'to show.'
                      : 'Take three readings. The middle one is kept.',
                  key: const ValueKey('waist-entry-note'),
                  style: text.bodySmall?.copyWith(color: context.mm.text2),
                ),
              ),
              const SizedBox(width: 12),
              MmButton(
                key: const ValueKey('save-waist'),
                label: 'Save',
                onPressed: ready ? () => _save(valid) : null,
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (summary != null) ...[
            Text(
              summary,
              key: const ValueKey('waist-summary'),
              style: text.bodyMedium,
            ),
            const SizedBox(height: 8),
          ],
          Text(
            'First thing in the morning, after the bathroom, before eating. '
            'Stand relaxed and breathe out normally. Keep the tape level '
            'with the navel, snug and not pressing in, and use the same '
            'tape each time. Once a week is enough.',
            style: text.bodySmall,
          ),
        ],
      ),
    );
  }
}
