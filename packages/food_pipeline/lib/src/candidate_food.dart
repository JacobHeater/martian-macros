import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'food_kind.dart';

/// One food as a source states it, mapped onto the pipeline's single schema
/// but not yet checked.
final class CandidateFood {
  const CandidateFood({
    required this.source,
    required this.sourceId,
    required this.kind,
    required this.name,
    this.brand,
    this.rawBarcode,
    this.kcal,
    this.proteinG,
    this.carbsG,
    this.fatG,
    this.fiberG,
    this.sodiumMg,
    this.alcoholG,
    this.servings = const [],
    this.versionKey = 0,
    this.updatedAt = 0,
  });

  /// `usda_branded`, `usda_foundation`, `usda_sr_legacy` or `off`.
  final String source;

  /// The food's id in that source.
  final String sourceId;
  final FoodKind kind;
  final String name;
  final String? brand;

  /// The barcode as the source stored it, before normalization.
  final String? rawBarcode;
  final double? kcal;
  final double? proteinG;
  final double? carbsG;
  final double? fatG;
  final double? fiberG;
  final double? sodiumMg;
  final double? alcoholG;
  final List<CatalogServing> servings;

  /// Orders versions of the same product within one source: the highest wins.
  final int versionKey;

  /// When the source last changed this record, in seconds since 1970; 0 when
  /// the source does not say.
  final int updatedAt;
}
