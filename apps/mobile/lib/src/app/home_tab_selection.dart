import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'home_destination.dart';

/// Which destination is showing. The app starts on the dashboard.
class HomeTabSelection extends Notifier<HomeDestination> {
  @override
  HomeDestination build() => HomeDestination.dashboard;

  void select(HomeDestination destination) => state = destination;
}
