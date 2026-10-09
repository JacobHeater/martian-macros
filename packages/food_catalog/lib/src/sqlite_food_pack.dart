import 'dart:convert';

import 'package:sqlite3/sqlite3.dart';

import 'catalog_food.dart';
import 'catalog_serving.dart';
import 'food_pack.dart';
import 'food_pack_format.dart';
import 'food_pack_header.dart';
import 'preparation_state.dart';
import 'search_hit.dart';
import 'trust_tier.dart';
import 'unsupported_pack_version.dart';

/// One installed pack file, opened read-only.
final class SqliteFoodPack implements FoodPack {
  SqliteFoodPack._(this._db, this.header);

  /// Opens the pack at [path]. Throws [UnsupportedPackVersion] for a format
  /// this code does not know, so it is refused and never misread.
  factory SqliteFoodPack.open(String path) =>
      SqliteFoodPack.fromDatabase(sqlite3.open(path, mode: OpenMode.readOnly));

  /// Wraps an already open pack database (tests, in-memory packs).
  factory SqliteFoodPack.fromDatabase(Database db) {
    try {
      return SqliteFoodPack._read(db);
    } on Object {
      db.close(); // never leave a file open that turned out not to be a pack
      rethrow;
    }
  }

  factory SqliteFoodPack._read(Database db) {
    final version = db.select('PRAGMA user_version').first.values.first! as int;
    if (version != FoodPackFormat.version) {
      throw UnsupportedPackVersion(
        found: version,
        supported: FoodPackFormat.version,
      );
    }
    final values = {
      for (final row in db.select('SELECT key, value FROM header'))
        row['key'] as String: row['value'] as String,
    };
    return SqliteFoodPack._(
      db,
      FoodPackHeader(
        packId: values['pack_id']!,
        formatVersion: version,
        builtOn: values['built_on']!,
        region: values['region']!,
        sources: (jsonDecode(values['sources']!) as List<Object?>)
            .cast<String>(),
        license: values['license']!,
        attribution: values['attribution']!,
      ),
    );
  }

  final Database _db;
  final FoodPackHeader header;

  @override
  String get packId => header.packId;

  static const _columns =
      'f.id, f.name, f.brand, f.kcal, f.protein, f.carbs, f.fat, f.fiber, '
      'f.sodium_mg, f.alcohol, f.preparation, f.pair_id, f.density, '
      'f.source, f.source_id, f.tier, f.tier_reason';

  @override
  List<SearchHit> search(String query, {int limit = 25, int offset = 0}) {
    final words = RegExp(
      r'[\p{L}\p{N}]+',
      unicode: true,
    ).allMatches(query.toLowerCase()).map((m) => m.group(0)!).toList();
    if (words.isEmpty) return const [];
    final match = words.map((w) => '"$w"*').join(' ');
    final rows = _db.select(
      'SELECT $_columns, bm25(foods_fts, 10.0, 1.0) AS score '
      'FROM foods_fts JOIN foods f ON f.id = foods_fts.rowid '
      'WHERE foods_fts MATCH ? ORDER BY score, f.id LIMIT ? OFFSET ?',
      [match, limit, offset],
    );
    return [
      for (final row in rows)
        SearchHit(_food(row), (row['score']! as num).toDouble()),
    ];
  }

  @override
  CatalogFood? byBarcode(String gtin14) {
    final rows = _db.select(
      'SELECT $_columns FROM barcodes b JOIN foods f ON f.id = b.food_id '
      'WHERE b.gtin = ?',
      [gtin14],
    );
    return rows.isEmpty ? null : _food(rows.first);
  }

  @override
  CatalogFood? pairOf(CatalogFood food) {
    final pairId = food.pairedFoodId;
    if (pairId == null || food.packId != header.packId) return null;
    final rows = _db.select('SELECT $_columns FROM foods f WHERE f.id = ?', [
      pairId,
    ]);
    return rows.isEmpty ? null : _food(rows.first);
  }

  @override
  List<CatalogServing> servingsOf(CatalogFood food) {
    if (food.packId != header.packId) return const [];
    return [
      for (final row in _db.select(
        'SELECT description, grams FROM servings WHERE food_id = ? '
        'ORDER BY rowid',
        [food.id],
      ))
        CatalogServing(
          description: row['description']! as String,
          grams: (row['grams']! as int) / FoodPackFormat.nutrientScale,
        ),
    ];
  }

  void close() => _db.close();

  CatalogFood _food(Row row) {
    double? scaled(String column) {
      final v = row[column] as int?;
      return v == null ? null : v / FoodPackFormat.nutrientScale;
    }

    final density = row['density'] as int?;
    return CatalogFood(
      id: row['id']! as int,
      packId: header.packId,
      name: row['name']! as String,
      brand: row['brand'] as String?,
      kcal: scaled('kcal')!,
      proteinG: scaled('protein')!,
      carbsG: scaled('carbs')!,
      fatG: scaled('fat')!,
      fiberG: scaled('fiber'),
      sodiumMg: scaled('sodium_mg'),
      alcoholG: scaled('alcohol'),
      preparation: PreparationState.fromCode(row['preparation']! as int),
      pairedFoodId: row['pair_id'] as int?,
      densityGPerMl: density == null
          ? null
          : density / FoodPackFormat.densityScale,
      source: row['source']! as String,
      sourceId: row['source_id'] as String?,
      tier: TrustTier.fromCode(row['tier']! as int),
      tierReason: row['tier_reason']! as String,
    );
  }
}
