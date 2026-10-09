import 'dart:io';

import 'candidate_food.dart';
import 'read_candidates.dart';

/// Every candidate the extract step wrote into [dir]: the barcode products,
/// then the generic foods.
Stream<CandidateFood> readExtract(Directory dir) async* {
  for (final name in const [
    'candidates_barcode.csv',
    'candidates_generic.csv',
  ]) {
    yield* readCandidates(File('${dir.path}/$name'));
  }
}
