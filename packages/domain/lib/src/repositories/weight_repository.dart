import 'weight_reader.dart';
import 'weight_writer.dart';

/// Reads and writes weigh-ins.
abstract interface class WeightRepository
    implements WeightReader, WeightWriter {}
