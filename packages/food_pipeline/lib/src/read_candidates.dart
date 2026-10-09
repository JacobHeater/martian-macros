import 'dart:convert';
import 'dart:io';

import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'candidate_food.dart';
import 'csv_rows.dart';
import 'food_kind.dart';

/// Reads the candidates file the extract step writes (see `sql/`): one row per
/// source food, in a header-led CSV.
Stream<CandidateFood> readCandidates(File file) async* {
  List<String>? header;
  await for (final row in csvRowsFromBytes(file.openRead())) {
    if (header == null) {
      header = row;
      continue;
    }
    yield candidateFromRow(header, row);
  }
}

/// One candidate from a CSV [row] under [header]. An empty cell is a missing
/// value.
CandidateFood candidateFromRow(List<String> header, List<String> row) {
  String? text(String column) {
    final i = header.indexOf(column);
    if (i < 0 || i >= row.length) return null;
    final v = row[i].trim();
    return v.isEmpty ? null : v;
  }

  double? number(String column) => double.tryParse(text(column) ?? '');

  final servingsJson = text('servings');
  return CandidateFood(
    source: text('source')!,
    sourceId: text('source_id')!,
    kind: text('kind') == 'generic' ? FoodKind.generic : FoodKind.barcode,
    name: row[header.indexOf('name')],
    brand: text('brand'),
    rawBarcode: text('gtin'),
    kcal: number('kcal'),
    proteinG: number('protein'),
    carbsG: number('carbs'),
    fatG: number('fat'),
    fiberG: number('fiber'),
    sodiumMg: number('sodium_mg'),
    alcoholG: number('alcohol'),
    servings: servingsJson == null ? const [] : _servings(servingsJson),
    versionKey: int.tryParse(text('version_key') ?? '') ?? 0,
  );
}

List<CatalogServing> _servings(String json) {
  final decoded = jsonDecode(json);
  if (decoded is! List<Object?>) return const [];
  return [
    for (final item in decoded)
      if (item is Map<String, Object?> &&
          item['d'] is String &&
          item['g'] is num &&
          (item['g']! as num) > 0)
        CatalogServing(
          description: item['d']! as String,
          grams: (item['g']! as num).toDouble(),
        ),
  ];
}
