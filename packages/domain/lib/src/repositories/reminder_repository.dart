import 'reminder_reader.dart';
import 'reminder_writer.dart';

/// Reads and writes reminder settings (MM-146).
abstract interface class ReminderRepository
    implements ReminderReader, ReminderWriter {}
