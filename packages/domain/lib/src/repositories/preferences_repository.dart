import 'easy_to_miss_reader.dart';
import 'easy_to_miss_writer.dart';
import 'preferences_reader.dart';
import 'preferences_writer.dart';

/// Reads and writes display preferences. Not health data and not part of the
/// profile: it exists before onboarding.
abstract interface class PreferencesRepository
    implements
        PreferencesReader,
        PreferencesWriter,
        EasyToMissReader,
        EasyToMissWriter {}
