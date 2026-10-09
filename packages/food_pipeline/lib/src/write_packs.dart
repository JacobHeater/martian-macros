import 'dart:io';

import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'build_provenance.dart';
import 'pack_build_result.dart';

/// Provisional until a qualified person has read the licensing (MM-57). It
/// states what the sources say about themselves and no more.
const packLicense =
    'Provisional. Open Food Facts data: Open Database License (ODbL) 1.0, with '
    'individual contents under the Database Contents License; derivative '
    'databases must be shared under the same conditions. USDA FoodData '
    'Central: published by the US Department of Agriculture; its public '
    'domain status is stated by USDA and has not been checked here.';

const packAttribution =
    'Food data from Open Food Facts (openfoodfacts.org), available under the '
    'Open Database License, and USDA FoodData Central.';

/// Writes `generic.pack`, `barcode_us.pack` and `report.txt` into [out].
void writePacks(
  PackBuildResult result,
  BuildProvenance provenance,
  Directory out,
) {
  out.createSync(recursive: true);
  FoodPackHeader header(String packId) => FoodPackHeader(
    packId: packId,
    formatVersion: FoodPackFormat.version,
    builtOn: provenance.builtOn,
    region: 'US',
    sources: provenance.sources,
    license: packLicense,
    attribution: packAttribution,
  );
  const writer = FoodPackWriter();
  writer.write('${out.path}/generic.pack', header('generic'), result.generic);
  writer.write(
    '${out.path}/barcode_us.pack',
    header('barcode_us'),
    result.barcode,
  );
  File('${out.path}/report.txt').writeAsStringSync(result.report.format());
}
