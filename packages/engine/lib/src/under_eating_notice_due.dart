import 'package:mm_domain/mm_domain.dart';

import 'under_eating_rule.dart';

/// Whether the notice for a finding shows on [today], given the day it was
/// last dismissed: not again within [UnderEatingRule.quietDays].
bool underEatingNoticeDue({
  required CalendarDate today,
  required CalendarDate? dismissedOn,
}) =>
    dismissedOn == null ||
    dismissedOn.daysUntil(today) >= UnderEatingRule.quietDays;
