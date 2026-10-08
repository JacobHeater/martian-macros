import 'package:mm_domain/mm_domain.dart';

extension QuantitySourceLabel on QuantitySource {
  String get label => switch (this) {
    QuantitySource.weighed => 'Weighed',
    QuantitySource.labelServing => 'Label serving',
    QuantitySource.householdMeasure => 'Cup / spoon',
    QuantitySource.palm => 'Palm',
    QuantitySource.cuppedHand => 'Cupped hand',
    QuantitySource.thumb => 'Thumb',
    QuantitySource.quickAdd => 'Estimate',
  };
}
