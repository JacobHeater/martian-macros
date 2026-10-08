import 'package:flutter/material.dart';

import '../ui/mm_surface.dart';
import 'evidence_row_card.dart';

/// The open or closed state of an [EvidenceRowCard].
class EvidenceRowCardState extends State<EvidenceRowCard> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    final row = widget.row;
    final text = Theme.of(context).textTheme;
    return MmSurface(
      onTap: () => setState(() => _open = !_open),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(row.decides, style: text.bodyLarge),
          const SizedBox(height: 4),
          Text(row.grade.inWords, style: text.labelLarge),
          if (_open) ...[
            const SizedBox(height: 8),
            Text('Value: ${row.value}', style: text.bodyMedium),
            const SizedBox(height: 4),
            Text('Source: ${row.source}', style: text.bodyMedium),
            const SizedBox(height: 4),
            Text('Based on: ${row.population}', style: text.bodyMedium),
          ],
        ],
      ),
    );
  }
}
