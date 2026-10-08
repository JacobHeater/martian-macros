import 'day_mark_reader.dart';
import 'day_mark_writer.dart';

/// Reads and writes day completeness marks.
abstract interface class DayMarkRepository
    implements DayMarkReader, DayMarkWriter {}
