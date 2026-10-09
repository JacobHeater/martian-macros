import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'add_food_sheet_state.dart';

/// Logs one food by its macros. Recent foods refill the form in one tap.
/// (Database search and barcode scanning arrive with the food pack.)
class AddFoodSheet extends ConsumerStatefulWidget {
  const AddFoodSheet({required this.day, this.meal, this.entry, super.key});

  final CalendarDate day;

  /// Preselected meal; otherwise one is chosen from the time of day.
  final Meal? meal;

  /// An entry already logged, to be corrected in place (MM-48).
  final FoodEntry? entry;

  @override
  ConsumerState<AddFoodSheet> createState() => AddFoodSheetState();
}
