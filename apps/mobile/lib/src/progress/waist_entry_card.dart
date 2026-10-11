import 'package:flutter/material.dart';

import 'waist_entry_card_state.dart';

/// The waist measurement card (MM-155): three readings, of which the
/// middle one is kept, or one reading for a quick entry. Fields are keyed
/// `entry-waist`, `entry-waist-2` and `entry-waist-3`, the button
/// `save-waist`.
class WaistEntryCard extends StatefulWidget {
  const WaistEntryCard({
    required this.unit,
    required this.summary,
    required this.onSave,
    super.key,
  });

  /// The unit the readings are typed in, in words: "inches".
  final String unit;

  /// What is known so far, under the fields; null before any measurement.
  final String? summary;

  /// Saves one reading or three, in the user's unit. An exception shows
  /// "That value looks off".
  final Future<void> Function(List<double> readings) onSave;

  @override
  State<WaistEntryCard> createState() => WaistEntryCardState();
}
