import 'package:mm_domain/mm_domain.dart';

extension EquipmentLabel on Equipment {
  String get label => switch (this) {
    Equipment.barbell => 'Barbell',
    Equipment.dumbbell => 'Dumbbell',
    Equipment.machine => 'Machine',
    Equipment.cable => 'Cable',
    Equipment.bodyweight => 'Bodyweight',
    Equipment.other => 'Other',
  };
}
