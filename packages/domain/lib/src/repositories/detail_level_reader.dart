import '../food/detail/detail_level.dart';

/// Reads how much nutrition detail to show.
abstract interface class DetailLevelReader {
  /// The setting, then each change. Standard until it changes.
  Stream<DetailLevel> watchDetailLevel();
}
