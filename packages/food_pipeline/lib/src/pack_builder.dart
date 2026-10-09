import 'package:mm_domain/mm_domain.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'build_report.dart';
import 'candidate_food.dart';
import 'conflict_policy.dart';
import 'drop_reason.dart';
import 'food_kind.dart';
import 'pack_build_result.dart';
import 'pack_entry_for.dart';

/// Turns candidates into pack entries (MM-52): applies the nutrition checks
/// (MM-53) and barcode normalization (MM-54) from `mm_domain`, keeps the newest
/// version of a product within a source, resolves a barcode two sources share
/// with [policy], and accounts for every entry read.
///
/// The output depends only on the candidates and the policy, never on their
/// order or the clock, so the same sources build the same packs.
final class PackBuilder {
  const PackBuilder({
    required this.policy,
    this.genericPackId = 'generic',
    this.barcodePackId = 'barcode_us',
  });

  final ConflictPolicy policy;
  final String genericPackId;
  final String barcodePackId;

  static const _disagreement =
      'Two sources disagree about this product by more than 10%. '
      'Check it against the package.';

  Future<PackBuildResult> build(Stream<CandidateFood> candidates) async {
    final report = BuildReport();
    final generic = <CandidateFood>[];
    final byBarcode = <String, Map<String, CandidateFood>>{};

    await for (final c in candidates) {
      report.countRead(c.source);
      final problem = checkNutrition(
        NutritionPer100g(
          name: c.name,
          kcal: c.kcal,
          proteinG: c.proteinG,
          carbsG: c.carbsG,
          fatG: c.fatG,
          fiberG: c.fiberG,
          alcoholG: c.alcoholG,
        ),
      );
      if (problem != null) {
        report.countDropped(c.source, DropReason.values.byName(problem.name));
        continue;
      }
      if (c.kind == FoodKind.generic) {
        generic.add(c);
        continue;
      }
      final raw = c.rawBarcode;
      final gtin = raw == null ? null : normalizeBarcode(raw);
      if (gtin == null) {
        report.countDropped(c.source, DropReason.invalidBarcode);
        continue;
      }
      final bySource = byBarcode.putIfAbsent(gtin, () => {});
      final existing = bySource[c.source];
      if (existing == null) {
        bySource[c.source] = c;
      } else if (_isNewer(c, existing)) {
        bySource[c.source] = c;
        report.countDropped(existing.source, DropReason.supersededVersion);
      } else {
        report.countDropped(c.source, DropReason.supersededVersion);
      }
    }

    final barcodeEntries = <PackEntry>[];
    final gtins = byBarcode.keys.toList()..sort();
    for (final gtin in gtins) {
      final sources = byBarcode[gtin]!;
      final names = sources.keys.toList()..sort();
      var winner = sources[names.first]!;
      var disagree = false;
      for (final name in names.skip(1)) {
        final other = sources[name]!;
        final resolution = policy.resolve(winner, other);
        final loser = identical(resolution.winner, winner) ? other : winner;
        report.countDropped(loser.source, DropReason.lostConflict);
        winner = resolution.winner;
        disagree = disagree || resolution.disagree;
      }
      barcodeEntries.add(
        packEntryFor(
          winner,
          id: barcodeEntries.length + 1,
          packId: barcodePackId,
          gtin14: gtin,
          disagreement: disagree ? _disagreement : null,
        ),
      );
      report.countWritten(winner.source);
    }

    generic.sort((a, b) {
      final byName = a.name.toLowerCase().compareTo(b.name.toLowerCase());
      return byName != 0 ? byName : a.sourceId.compareTo(b.sourceId);
    });
    final genericEntries = [
      for (var i = 0; i < generic.length; i++)
        packEntryFor(generic[i], id: i + 1, packId: genericPackId),
    ];
    for (final c in generic) {
      report.countWritten(c.source);
    }

    return PackBuildResult(
      generic: genericEntries,
      barcode: barcodeEntries,
      report: report,
    );
  }

  static bool _isNewer(CandidateFood candidate, CandidateFood existing) {
    if (candidate.versionKey != existing.versionKey) {
      return candidate.versionKey > existing.versionKey;
    }
    return candidate.sourceId.compareTo(existing.sourceId) > 0;
  }
}
