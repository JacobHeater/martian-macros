import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'insight_card_state.dart';

/// The one insight for today, if any (MM-141): what the coach noticed in the
/// user's own numbers, the evidence one tap down, and a way to dismiss it. At
/// most one new insight a day and three a week ever appear.
class InsightCard extends ConsumerStatefulWidget {
  const InsightCard({super.key});

  @override
  ConsumerState<InsightCard> createState() => InsightCardState();
}
