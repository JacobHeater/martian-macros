import 'package:mm_domain/mm_domain.dart';

extension DetailLevelLabel on DetailLevel {
  String get label => switch (this) {
    DetailLevel.simple => 'Simple',
    DetailLevel.standard => 'Standard',
    DetailLevel.full => 'Full',
  };

  /// What this level shows, in a sentence for Settings.
  String get description => switch (this) {
    DetailLevel.simple => 'Calories and protein.',
    DetailLevel.standard => 'Calories, protein, carbohydrate and fat.',
    DetailLevel.full => 'Adds fiber, net carbohydrate, sodium and alcohol where the food states them.',
  };
}
