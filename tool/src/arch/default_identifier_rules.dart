import 'forbidden_identifier_rule.dart';

/// One implementation per control (MM-163): a screen never builds a raw
/// Material control; it uses the design-system component in `ui/`, which wraps
/// each exactly once. Components take meaning, not styling, so two screens
/// cannot drift.
const defaultIdentifierRules = <ForbiddenIdentifierRule>[
  ForbiddenIdentifierRule(
    appliesTo: 'apps/mobile/lib/',
    identifiers: [
      'FilledButton',
      'ElevatedButton',
      'OutlinedButton',
      'TextButton',
      'IconButton',
      'FloatingActionButton',
      'DropdownButton',
      'DropdownMenu',
      'DropdownButtonFormField',
      'SegmentedButton',
      'PopupMenuButton',
      'Switch',
      'SwitchListTile',
      'Checkbox',
      'CheckboxListTile',
      'Radio',
      'RadioListTile',
      'TextField',
      'TextFormField',
      'Slider',
      'Card',
      'ListTile',
      'Chip',
      'ChoiceChip',
      'ActionChip',
      'FilterChip',
      'InputChip',
      'NavigationBar',
      'AppBar',
      'AlertDialog',
      'SimpleDialog',
      'SnackBar',
      'LinearProgressIndicator',
      'CircularProgressIndicator',
    ],
    reason:
        'use the design-system component in ui/ (add one there first if none '
        'fits)',
    allowedPrefixes: ['apps/mobile/lib/src/ui/', 'apps/mobile/lib/src/theme/'],
  ),
  // One calorie visual (MM-187): the horizon arc, inside the calorie hero,
  // and nowhere else. A screen that wants a day's calories uses CalorieHero;
  // it never builds its own hero surface or draws the arc itself.
  ForbiddenIdentifierRule(
    appliesTo: 'apps/mobile/lib/',
    identifiers: ['MmHeroSurface', 'HorizonArc'],
    reason:
        'calories for a day are shown by CalorieHero, the one calorie visual '
        '(MM-187)',
    allowedPrefixes: [
      'apps/mobile/lib/src/ui/',
      'apps/mobile/lib/src/food/calorie_hero.dart',
      // Brand art on the first screen, not a calorie figure.
      'apps/mobile/lib/src/onboarding/welcome_step.dart',
    ],
  ),
];
