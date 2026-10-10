import 'package:mm_domain/mm_domain.dart';

/// The first day an unanswered reminder counts as ignored when it is turned
/// on, or kept, at [minuteNow] on [today] (MM-146): today while its time is
/// still ahead, otherwise tomorrow. Today's was never sent.
CalendarDate reminderCountFrom({
  required CalendarDate today,
  required int minuteNow,
  required int minuteOfDay,
}) => minuteNow < minuteOfDay ? today : today.addDays(1);
