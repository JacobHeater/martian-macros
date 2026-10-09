import 'package:mm_domain/mm_domain.dart';

import 'app_database.dart';
import 'portion_columns.dart';

/// A stored food row as the domain object the rest of the app sees.
FoodEntry foodFromRow(FoodRow r) => FoodEntry(
  id: r.id,
  date: CalendarDate.fromEpochDay(r.epochDay),
  meal: r.meal,
  name: r.name,
  kcal: r.kcal,
  proteinG: r.proteinG,
  carbsG: r.carbsG,
  fatG: r.fatG,
  source: r.quantitySource,
  portion: portionFromRow(r),
);
