import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'build_report.dart';

/// What a build produced, before it is written to files.
final class PackBuildResult {
  const PackBuildResult({
    required this.generic,
    required this.barcode,
    required this.report,
  });

  /// Foods without barcodes, sorted by name.
  final List<PackEntry> generic;

  /// Products with barcodes, sorted by barcode.
  final List<PackEntry> barcode;
  final BuildReport report;
}
