import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../repository_role_providers.dart';

/// Logs each of [entries] as a new entry. The day's completeness mark is not
/// touched: a copied day still has to be confirmed (MM-47).
Future<void> copyEntries(WidgetRef ref, List<FoodEntry> entries) async {
  final writer = ref.read(foodEntryWriterProvider);
  for (final e in entries) {
    await writer.addFood(e);
  }
}
