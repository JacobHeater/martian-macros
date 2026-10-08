import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'home_destination.dart';
import 'home_tab_selection.dart';

final homeTabProvider = NotifierProvider<HomeTabSelection, HomeDestination>(
  HomeTabSelection.new,
);
