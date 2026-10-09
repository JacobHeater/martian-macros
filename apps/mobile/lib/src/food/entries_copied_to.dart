import 'package:mm_domain/mm_domain.dart';

/// Fresh copies of [entries] on [day], for logging again (MM-47). Each keeps
/// its meal unless [meal] is given. They are ordinary new entries (id 0), so
/// editing a copy never touches the original.
List<FoodEntry> entriesCopiedTo(
  CalendarDate day,
  List<FoodEntry> entries, {
  Meal? meal,
}) => [
  for (final e in entries)
    FoodEntry(
      id: 0,
      date: day,
      meal: meal ?? e.meal,
      name: e.name,
      kcal: e.kcal,
      proteinG: e.proteinG,
      carbsG: e.carbsG,
      fatG: e.fatG,
      source: e.source,
      portion: e.portion,
    ),
];
