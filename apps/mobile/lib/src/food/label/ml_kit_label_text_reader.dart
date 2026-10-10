import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image_picker/image_picker.dart';

import 'label_text_reader.dart';

/// Takes a photo with the camera and reads its text on the phone with ML Kit
/// (MM-44). The photo is not kept and nothing is uploaded.
final class MlKitLabelTextReader implements LabelTextReader {
  const MlKitLabelTextReader();

  @override
  Future<String?> readLabel() async {
    final photo = await ImagePicker().pickImage(
      source: ImageSource.camera,
      maxWidth: 2400,
    );
    if (photo == null) return null;
    final recognizer = TextRecognizer();
    try {
      final result = await recognizer.processImage(
        InputImage.fromFilePath(photo.path),
      );
      return result.text;
    } finally {
      await recognizer.close();
    }
  }
}
