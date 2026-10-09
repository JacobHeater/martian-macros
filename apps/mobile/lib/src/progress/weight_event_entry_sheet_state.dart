import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../repository_role_providers.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_dropdown.dart';
import '../ui/mm_list_row.dart';
import '../ui/show_mm_snack_bar.dart';
import 'weight_event_entry_sheet.dart';
import 'weight_event_label.dart';

class WeightEventEntrySheetState extends ConsumerState<WeightEventEntrySheet> {
  var _type = WeightEventType.illness;
  late CalendarDate _date = widget.today;
  var _saving = false;

  Future<void> _pickDate() async {
    final today = widget.today;
    final minDate = today.addDays(-28);
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(_date.year, _date.month, _date.day),
      firstDate: DateTime(minDate.year, minDate.month, minDate.day),
      lastDate: DateTime(today.year, today.month, today.day),
      helpText: 'Weight event date',
    );
    if (picked != null && mounted) {
      setState(() => _date = CalendarDate.fromDateTime(picked));
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref
          .read(weightEventWriterProvider)
          .saveWeightEvent(WeightEvent(date: _date, type: _type));
    } catch (error, stackTrace) {
      if (mounted) setState(() => _saving = false);
      FlutterError.reportError(
        FlutterErrorDetails(
          exception: error,
          stack: stackTrace,
          library: 'weight events',
          context: ErrorDescription('while saving a weight event'),
        ),
      );
      if (mounted) {
        showMmSnackBar(
          ScaffoldMessenger.of(context),
          'Could not save the weight event. Please try again.',
        );
      }
      return;
    }
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(
      24,
      24,
      24,
      MediaQuery.viewInsetsOf(context).bottom + 24,
    ),
    child: SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Add a weight event',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          MmDropdown<WeightEventType>(
            label: 'Event',
            initialValue: _type,
            items: [
              for (final type in WeightEventType.values)
                DropdownMenuItem(
                  value: type,
                  child: Text(weightEventLabel(type)),
                ),
            ],
            onChanged: _saving
                ? null
                : (value) {
                    if (value != null) setState(() => _type = value);
                  },
          ),
          MmListRow(
            title: 'Date',
            subtitle: _date.toString(),
            trailing: const Icon(Icons.calendar_today_outlined),
            onTap: _saving ? null : _pickDate,
          ),
          const Text('Events can be added for the last 28 days.'),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              MmButton(
                label: 'Cancel',
                kind: MmButtonKind.text,
                onPressed: _saving ? null : () => Navigator.of(context).pop(),
              ),
              const SizedBox(width: 8),
              MmButton(label: 'Save event', onPressed: _saving ? null : _save),
            ],
          ),
        ],
      ),
    ),
  );
}
