import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'health_recheck_dismissal.dart';

final healthRecheckDismissalProvider =
    NotifierProvider<HealthRecheckDismissal, bool>(HealthRecheckDismissal.new);
