import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'label_text_reader.dart';
import 'ml_kit_label_text_reader.dart';

/// The camera label reader. Tests replace it with a fake.
final labelTextReaderProvider = Provider<LabelTextReader>(
  (ref) => const MlKitLabelTextReader(),
);
