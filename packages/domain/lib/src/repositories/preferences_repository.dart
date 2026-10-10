import 'detail_level_reader.dart';
import 'detail_level_writer.dart';
import 'easy_to_miss_reader.dart';
import 'easy_to_miss_writer.dart';
import 'preferences_reader.dart';
import 'preferences_writer.dart';
import 'recovery_skip_reader.dart';
import 'recovery_skip_writer.dart';
import 'return_screen_reader.dart';
import 'return_screen_writer.dart';
import 'under_eating_notice_reader.dart';
import 'under_eating_notice_writer.dart';

/// Reads and writes display preferences. Not health data and not part of the
/// profile: it exists before onboarding.
abstract interface class PreferencesRepository
    implements
        PreferencesReader,
        PreferencesWriter,
        EasyToMissReader,
        EasyToMissWriter,
        DetailLevelReader,
        DetailLevelWriter,
        UnderEatingNoticeReader,
        UnderEatingNoticeWriter,
        ReturnScreenReader,
        ReturnScreenWriter,
        RecoverySkipReader,
        RecoverySkipWriter {}
