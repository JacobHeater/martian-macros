import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../ui/mm_fab.dart';
import 'selected_day_provider.dart';
import 'show_add_food_sheet.dart';

/// The primary action on Today: opens the add-food sheet for the shown day.
class AddFoodButton extends ConsumerWidget {
  const AddFoodButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final day = shownDay(ref);
    return MmFab(
      label: 'Add food',
      icon: Icons.add,
      onPressed: () => showAddFoodSheet(context, day),
    );
  }
}
