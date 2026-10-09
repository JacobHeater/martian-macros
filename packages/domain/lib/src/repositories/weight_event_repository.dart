import 'weight_event_reader.dart';
import 'weight_event_writer.dart';

/// Reads and writes user-reported scale-weight events.
abstract interface class WeightEventRepository
    implements WeightEventReader, WeightEventWriter {}
