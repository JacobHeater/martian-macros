import '../food/detail/detail_level.dart';

/// Writes how much nutrition detail to show.
abstract interface class DetailLevelWriter {
  Future<void> saveDetailLevel(DetailLevel level);
}
