import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../coach/target_change_sheet.dart';
import '../providers.dart';
import '../repository_role_providers.dart';
import '../ui/show_mm_snack_bar.dart';
import 'check_in.dart';
import 'target_change_summary_host.dart';

class TargetChangeSummaryHostState
    extends ConsumerState<TargetChangeSummaryHost> {
  bool _showingSummary = false;

  @override
  Widget build(BuildContext context) {
    final history = ref.watch(targetsHistoryProvider).value;
    final generatedThisLaunch = ref.watch(checkInProvider);
    if (history != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _showNextSummary(history, generatedThisLaunch);
      });
    }
    return widget.child;
  }

  void _showNextSummary(
    List<TargetsRecord> history,
    Set<int> generatedThisLaunch,
  ) {
    if (_showingSummary) return;
    var index = -1;
    for (var i = 0; i < history.length; i++) {
      final previous = i == 0 ? null : history[i - 1];
      final record = history[i];
      if (_hasUnseenChange(record, previous) &&
          !generatedThisLaunch.contains(record.effectiveFrom.epochDay)) {
        index = i;
        break;
      }
    }
    if (index < 0) return;

    _showingSummary = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _presentSummary(history, index);
    });
  }

  Future<void> _presentSummary(List<TargetsRecord> history, int index) async {
    final current = history[index];
    try {
      if (!mounted) return;
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        useSafeArea: true,
        builder: (_) => TargetChangeSheet(
          current: current,
          previous: index == 0 ? null : history[index - 1],
        ),
      );
    } catch (error, stackTrace) {
      _reportError(
        error,
        stackTrace,
        'while showing the target-change summary',
      );
      return;
    }

    if (!mounted) {
      _showingSummary = false;
      return;
    }
    try {
      await ref
          .read(targetsHistoryWriterProvider)
          .markSummariesSeenThrough(current.effectiveFrom);
    } catch (error, stackTrace) {
      _reportError(
        error,
        stackTrace,
        'while recording a target-change summary as shown',
      );
      return;
    }
    _showingSummary = false;
    if (mounted) {
      _showNextSummary(
        ref.read(targetsHistoryProvider).value ?? history,
        ref.read(checkInProvider),
      );
    }
  }

  void _reportError(Object error, StackTrace stackTrace, String context) {
    _showingSummary = false;
    FlutterError.reportError(
      FlutterErrorDetails(
        exception: error,
        stack: stackTrace,
        library: 'target-change summary',
        context: ErrorDescription(context),
      ),
    );
    if (mounted) {
      showMmSnackBar(
        ScaffoldMessenger.of(this.context),
        'Could not finish the target summary. '
        'It will be available again when you reopen the app.',
      );
    }
  }

  bool _hasUnseenChange(TargetsRecord record, TargetsRecord? previous) {
    if (record.summarySeen ||
        previous == null ||
        record.explanation?.previousKcal == null) {
      return false;
    }
    final current = record.targets;
    final prior = previous.targets;
    return record.mode != previous.mode ||
        current.kcal.round() != prior.kcal.round() ||
        current.proteinG.round() != prior.proteinG.round() ||
        current.proteinMinimumG?.round() != prior.proteinMinimumG?.round() ||
        current.carbsG.round() != prior.carbsG.round() ||
        current.fatG.round() != prior.fatG.round() ||
        current.weeklyRateFraction != prior.weeklyRateFraction;
  }
}
