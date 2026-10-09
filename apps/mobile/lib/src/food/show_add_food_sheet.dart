import 'package:flutter/material.dart';
import 'package:mm_domain/mm_domain.dart';

import 'add_food_sheet.dart';

/// Opens the add-food sheet for [day], optionally preselecting a meal, or
/// editing [entry].
Future<void> showAddFoodSheet(
  BuildContext context,
  CalendarDate day, {
  Meal? meal,
  FoodEntry? entry,
}) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  builder: (_) => AddFoodSheet(day: day, meal: meal, entry: entry),
);
