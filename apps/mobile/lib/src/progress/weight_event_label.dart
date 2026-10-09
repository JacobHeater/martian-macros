import 'package:mm_domain/mm_domain.dart';

String weightEventLabel(WeightEventType type) => switch (type) {
  WeightEventType.startedCreatine => 'Started creatine',
  WeightEventType.stoppedCreatine => 'Stopped creatine',
  WeightEventType.illness => 'Illness',
  WeightEventType.travel => 'Travel',
  WeightEventType.newTraining => 'New or harder training',
  WeightEventType.largeOrSaltyMeal => 'Unusually large or salty meal',
  WeightEventType.other => 'Other',
};
