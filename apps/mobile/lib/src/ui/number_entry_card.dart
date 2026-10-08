import 'package:flutter/material.dart';

import 'number_entry_card_state.dart';

/// A card for entering one number (a weigh-in, a waist measurement), with a
/// save button and a hint. Fields are keyed `entry-<fieldKey>` and
/// `save-<fieldKey>`.
class NumberEntryCard extends StatefulWidget {
  const NumberEntryCard({
    required this.title,
    required this.unit,
    required this.fieldKey,
    required this.initial,
    required this.hint,
    required this.onSave,
    super.key,
  });

  final String title;
  final String unit;
  final String fieldKey;
  final String? initial;
  final String hint;

  /// Saves the value; an exception shows "That value looks off".
  final Future<void> Function(double value) onSave;

  @override
  State<NumberEntryCard> createState() => NumberEntryCardState();
}
