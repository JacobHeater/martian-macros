import 'package:flutter/material.dart';

import '../format/parse_number.dart';
import 'info_card.dart';
import 'mm_button.dart';
import 'mm_text_field.dart';
import 'mm_text_field_kind.dart';
import 'number_entry_card.dart';
import 'show_mm_snack_bar.dart';

class NumberEntryCardState extends State<NumberEntryCard> {
  late final _controller = TextEditingController(text: widget.initial);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save(double value) async {
    final messenger = ScaffoldMessenger.of(context);
    FocusScope.of(context).unfocus();
    try {
      await widget.onSave(value);
    } on Exception {
      showMmSnackBar(messenger, 'That value looks off. Check it.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final value = parseNumber(_controller.text);
    final changed = _controller.text != (widget.initial ?? '');
    return InfoCard(
      title: widget.title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: MmTextField(
                  key: ValueKey('entry-${widget.fieldKey}'),
                  controller: _controller,
                  kind: MmTextFieldKind.number,
                  suffix: widget.unit,
                  dense: true,
                  onChanged: (_) => setState(() {}),
                ),
              ),
              const SizedBox(width: 12),
              MmButton(
                key: ValueKey('save-${widget.fieldKey}'),
                label: 'Save',
                onPressed: value == null || value <= 0 || !changed
                    ? null
                    : () => _save(value),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(widget.hint, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
