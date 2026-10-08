import 'package:flutter/material.dart';

import 'mm_segment.dart';

/// A short single-choice control (units, a chart range).
class MmSegmented<T> extends StatelessWidget {
  const MmSegmented({
    required this.segments,
    required this.selected,
    required this.onChanged,
    this.compact = false,
    this.allowEmpty = false,
    super.key,
  });

  final List<MmSegment<T>> segments;
  final Set<T> selected;
  final ValueChanged<Set<T>> onChanged;

  /// Smaller, without the check mark; for use beside a heading.
  final bool compact;

  /// Whether nothing may be selected (an optional mark).
  final bool allowEmpty;

  @override
  Widget build(BuildContext context) => SegmentedButton<T>(
    showSelectedIcon: !compact,
    style: compact
        ? const ButtonStyle(visualDensity: VisualDensity.compact)
        : null,
    emptySelectionAllowed: allowEmpty,
    segments: [
      for (final s in segments)
        ButtonSegment<T>(
          value: s.value,
          label: Text(s.label),
          icon: s.icon == null ? null : Icon(s.icon),
        ),
    ],
    selected: selected,
    onSelectionChanged: onChanged,
  );
}
