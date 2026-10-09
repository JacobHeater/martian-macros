import 'package:mm_food_catalog/mm_food_catalog.dart';

/// The one quiet mark a food carries (MM-153). It says what the numbers are,
/// not that anyone checked them: there is deliberately no "verified".
extension TrustTierLabel on TrustTier {
  String get label => switch (this) {
    TrustTier.reference => 'Reference',
    TrustTier.label => 'Label',
    TrustTier.checkThis => 'Check this',
  };
}
