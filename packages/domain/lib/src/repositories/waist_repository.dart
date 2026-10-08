import 'waist_reader.dart';
import 'waist_writer.dart';

/// Reads and writes waist measurements.
abstract interface class WaistRepository implements WaistReader, WaistWriter {}
