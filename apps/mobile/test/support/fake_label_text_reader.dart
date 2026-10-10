import 'package:martian_macros/src/food/label/label_text_reader.dart';

/// A label reader for tests: returns [text], or null (cancelled).
final class FakeLabelTextReader implements LabelTextReader {
  const FakeLabelTextReader(this.text);

  final String? text;

  @override
  Future<String?> readLabel() async => text;
}
