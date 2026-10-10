import 'package:mm_engine/mm_engine.dart';

import 'fmt.dart';

/// The under-eating notice's words (MM-114): what was seen, the innocent
/// explanation and its fix first, then the other one. Nothing is praised and
/// nobody is told what they have.
String underEatingText(UnderEatingFinding f, {required bool supportLine}) => [
  'Your logged days average ${Fmt.whole(f.averageKcal)} kcal. The lowest the '
      'app would ever suggest for you is ${Fmt.whole(f.floorKcal)}.',
  'If those days are missing food, mark them partial.',
  'If they are complete, that is less than the app considers enough. Eating '
      'at your target will not slow your progress the way it feels like it '
      'will.',
  if (supportLine)
    'If eating has become a source of distress, a doctor or a registered '
        'dietitian is the right person to talk to.',
].join(' ');
