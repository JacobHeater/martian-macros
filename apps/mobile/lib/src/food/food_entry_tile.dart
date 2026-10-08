import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import '../format/fmt.dart';
import '../format/quantity_source_label.dart';
import '../ui/mm_list_row.dart';

/// One logged food: name, macros and where the quantity came from, with its
/// energy on the right.
class FoodEntryTile extends StatelessWidget {
  const FoodEntryTile({required this.entry, super.key});

  final FoodEntry entry;

  @override
  Widget build(BuildContext context) => MmListRow(
    dense: true,
    title: entry.name,
    subtitle:
        'P ${entry.proteinG.round()}  C ${entry.carbsG.round()}  '
        'F ${entry.fatG.round()}  ·  ${entry.source.label}',
    trailing: Text(
      Fmt.whole(entry.kcal),
      style: Theme.of(context).textTheme.titleSmall,
    ),
  );
}
