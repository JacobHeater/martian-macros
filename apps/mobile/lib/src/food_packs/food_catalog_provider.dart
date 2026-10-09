import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'food_pack_providers.dart';

/// The installed packs read as one catalog (MM-42). Empty until a pack is
/// installed; search then has nothing to find and the sheet says so.
final foodCatalogProvider = FutureProvider<FoodCatalog>((ref) async {
  final installed = await ref.watch(installedPacksProvider.future);
  final packs = <SqliteFoodPack>[];
  for (final pack in installed) {
    try {
      packs.add(SqliteFoodPack.open(pack.path));
    } on Object {
      // A pack that will not open is skipped, not fatal to search.
    }
  }
  ref.onDispose(() {
    for (final pack in packs) {
      pack.close();
    }
  });
  return FoodCatalog(packs);
});
