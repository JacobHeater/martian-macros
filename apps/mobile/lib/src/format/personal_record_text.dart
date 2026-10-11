import 'package:mm_engine/mm_engine.dart';

import 'fmt.dart';

/// One personal record in a line (MM-92): "Back squat: estimated max
/// 110.0 kg, up from 107.5 kg."
String personalRecordText(PersonalRecord record, Fmt fmt) =>
    '${record.name}: estimated max ${fmt.weight(record.estimateKg)}, '
    'up from ${fmt.weight(record.previousBestKg)}.';
