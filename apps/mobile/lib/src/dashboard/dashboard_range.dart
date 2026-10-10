import 'package:flutter_riverpod/flutter_riverpod.dart';

class DashboardRange extends Notifier<int> {
  @override
  int build() => 30;

  void select(int days) => state = days;
}
