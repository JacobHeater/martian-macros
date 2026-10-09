import 'dart:convert';
import 'dart:io';

import 'package:sqlite3/sqlite3.dart';

import 'food_pack_format.dart';
import 'food_pack_header.dart';
import 'pack_entry.dart';

/// Writes a pack file. The pipeline (MM-52) and the test fixture use it, so
/// the format is defined once.
final class FoodPackWriter {
  const FoodPackWriter();

  /// Writes [entries] to a new file at [path], replacing any file there.
  void write(String path, FoodPackHeader header, List<PackEntry> entries) {
    final file = File(path);
    if (file.existsSync()) file.deleteSync();
    final db = sqlite3.open(path);
    try {
      _fill(db, header, entries);
    } finally {
      db.close();
    }
  }

  /// Builds the same pack in memory, for tests.
  Database writeInMemory(FoodPackHeader header, List<PackEntry> entries) {
    final db = sqlite3.openInMemory();
    _fill(db, header, entries);
    return db;
  }

  void _fill(Database db, FoodPackHeader header, List<PackEntry> entries) {
    db.execute(FoodPackFormat.schema);
    db.execute('BEGIN');
    final headerValues = {
      'pack_id': header.packId,
      'built_on': header.builtOn,
      'region': header.region,
      'sources': jsonEncode(header.sources),
      'license': header.license,
      'attribution': header.attribution,
    };
    for (final e in headerValues.entries) {
      db.execute('INSERT INTO header (key, value) VALUES (?, ?)', [
        e.key,
        e.value,
      ]);
    }
    int? scaled(double? v) =>
        v == null ? null : (v * FoodPackFormat.nutrientScale).round();
    final insertFood = db.prepare(
      'INSERT INTO foods (id, name, brand, kcal, protein, carbs, fat, fiber, '
      'sodium_mg, alcohol, preparation, pair_id, density, source, source_id, '
      'tier, tier_reason) '
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    final insertServing = db.prepare(
      'INSERT INTO servings (food_id, description, grams) VALUES (?, ?, ?)',
    );
    final insertBarcode = db.prepare(
      'INSERT INTO barcodes (gtin, food_id) VALUES (?, ?)',
    );
    for (final e in entries) {
      final f = e.food;
      insertFood.execute([
        f.id,
        f.name,
        f.brand,
        scaled(f.kcal),
        scaled(f.proteinG),
        scaled(f.carbsG),
        scaled(f.fatG),
        scaled(f.fiberG),
        scaled(f.sodiumMg),
        scaled(f.alcoholG),
        f.preparation.code,
        f.pairedFoodId,
        f.densityGPerMl == null
            ? null
            : (f.densityGPerMl! * FoodPackFormat.densityScale).round(),
        f.source,
        f.sourceId,
        f.tier.code,
        f.tierReason,
      ]);
      for (final s in e.servings) {
        insertServing.execute([f.id, s.description, scaled(s.grams)]);
      }
      for (final b in e.barcodes) {
        insertBarcode.execute([b, f.id]);
      }
    }
    insertFood.close();
    insertServing.close();
    insertBarcode.close();
    db.execute("INSERT INTO foods_fts(foods_fts) VALUES ('rebuild')");
    db.execute('COMMIT');
    db.execute('PRAGMA user_version = ${FoodPackFormat.version}');
  }
}
