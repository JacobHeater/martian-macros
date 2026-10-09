import 'package:mm_food_catalog/mm_food_catalog.dart';

/// Where a food's numbers came from, in words (MM-153). Never "verified".
extension FoodSourceLabel on CatalogFood {
  String get sourceLabel => switch (source) {
    'usda_foundation' || 'usda_sr_legacy' => 'USDA, lab-analyzed',
    'usda_branded' => 'Manufacturer label (USDA)',
    'off' => 'Community label (Open Food Facts)',
    'user_scan' => 'Your label scan',
    'user' => 'Your food',
    'estimate' => 'Estimate',
    _ => 'Food database',
  };
}
