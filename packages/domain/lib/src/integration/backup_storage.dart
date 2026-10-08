import 'backup_reader.dart';
import 'backup_writer.dart';

/// Somewhere to keep encrypted backup blobs: a cloud drive, a folder, a share
/// target. Knows nothing of accounts, tokens or encryption.
abstract interface class BackupStorage implements BackupReader, BackupWriter {}
