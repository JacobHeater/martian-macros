import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../coach/coach_screen.dart';
import '../progress/progress_screen.dart';
import '../providers.dart';
import '../settings/settings_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../food/add_food_button.dart';
import '../food/food_day_header.dart';
import '../food/food_screen.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_icon_button.dart';
import '../ui/mm_nav_destination.dart';
import '../ui/mm_navigation_bar.dart';
import 'home_destination.dart';
import 'home_shell.dart';
import 'home_tab_provider.dart';
import 'target_change_summary_host.dart';

class HomeShellState extends ConsumerState<HomeShell>
    with WidgetsBindingObserver {
  static const _destinations = [
    MmNavDestination(
      label: 'Dashboard',
      icon: Icons.home_outlined,
      selectedIcon: Icons.home,
    ),
    MmNavDestination(
      label: 'Food',
      icon: Icons.restaurant_outlined,
      selectedIcon: Icons.restaurant,
    ),
    MmNavDestination(label: 'Progress', icon: Icons.show_chart),
    MmNavDestination(
      label: 'Coach',
      icon: Icons.insights_outlined,
      selectedIcon: Icons.insights,
    ),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Roll the calendar day over if the app was left open overnight.
    if (state == AppLifecycleState.resumed) ref.invalidate(todayProvider);
  }

  @override
  Widget build(BuildContext context) {
    final destination = ref.watch(homeTabProvider);

    return TargetChangeSummaryHost(
      child: Scaffold(
        appBar: MmAppBar(
          title: switch (destination) {
            HomeDestination.food => null,
            HomeDestination.dashboard => 'Today',
            _ => destination.label,
          },
          titleWidget: destination == HomeDestination.food
              ? const FoodDayHeader()
              : null,
          actions: [
            MmIconButton(
              tooltip: 'Settings',
              icon: Icons.settings_outlined,
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const SettingsScreen()),
              ),
            ),
          ],
        ),
        body: IndexedStack(
          index: destination.index,
          children: const [
            DashboardScreen(),
            FoodScreen(),
            ProgressScreen(),
            CoachScreen(),
          ],
        ),
        floatingActionButton:
            destination == HomeDestination.dashboard ||
                destination == HomeDestination.food
            ? const AddFoodButton()
            : null,
        bottomNavigationBar: MmNavigationBar(
          destinations: _destinations,
          selectedIndex: destination.index,
          onSelected: (i) => ref
              .read(homeTabProvider.notifier)
              .select(HomeDestination.values[i]),
        ),
      ),
    );
  }
}
