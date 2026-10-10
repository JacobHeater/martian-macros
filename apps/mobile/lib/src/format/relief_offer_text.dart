import 'package:mm_engine/mm_engine.dart';

/// The fixed words of the offer to ease a deficit (MM-117). Nothing here
/// suggests eating less, training more or adding cardio.
({String title, String body, String suggestion, String? sleep}) reliefOfferText(
  ReliefOffer offer,
) => (
  title: 'Two hard weeks in a row',
  body:
      'Your last two check-ins had most answers at the hard end. On a '
      'deficit that usually means it is too large, or has run too long, for '
      'you right now. Easing it is the fix.',
  suggestion: switch (offer.suggestion) {
    ReliefChoice.maintenanceWeek =>
      offer.slowerPace == null
          ? 'The coach would take a maintenance week: a week at maintenance '
                'is a diet break taken early, and the deficit can resume '
                'after it.'
          : 'The coach would take a maintenance week: you are '
                '${offer.deficitWeeks} weeks into this deficit, and a week at '
                'maintenance is a diet break taken early.',
    ReliefChoice.slowerPace || ReliefChoice.carryOn =>
      'The coach would slow the pace: you are early in this deficit, and a '
          'gentler pace is easier to hold than a break.',
  },
  sleep: offer.shortSleep
      ? 'Your sleep has averaged under six hours. Short sleep during a '
            'deficit appears to shift loss away from fat, so sleep may be the '
            'cheaper fix.'
      : null,
);
