import 'package:mm_domain/mm_domain.dart';

/// Fiber, net carbohydrate, sodium and alcohol for Full detail (MM-49), only
/// the ones the entry's source stated. Null when it states none.
String? extraNutrientsLine(FoodEntry e) {
  final parts = [
    if (e.fiberG != null) 'Fiber ${e.fiberG!.round()} g',
    if (e.netCarbsG != null) 'Net carbs ${e.netCarbsG!.round()} g',
    if (e.sodiumMg != null) 'Sodium ${e.sodiumMg!.round()} mg',
    if (e.alcoholG != null && e.alcoholG! > 0)
      'Alcohol ${e.alcoholG!.round()} g',
  ];
  return parts.isEmpty ? null : parts.join(' · ');
}
