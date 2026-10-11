import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:mm_engine/mm_engine.dart';

import '../theme/mm_colors_context.dart';

class MuscleVolumeRow extends StatelessWidget {
  const MuscleVolumeRow({required this.volume, super.key});

  final MuscleVolume volume;

  @override
  Widget build(BuildContext context) {
    String sets(double value) => value == value.roundToDouble()
        ? value.toInt().toString()
        : value.toStringAsFixed(1);
    final name = volume.group.name;
    final label = '${name[0].toUpperCase()}${name.substring(1)}';
    final delta = volume.change;
    final change = '${delta > 0 ? '+' : ''}${sets(delta)}';
    final maximum = math.max(
      20.0,
      math.max(volume.currentSets, volume.previousSets),
    );
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 4,
            children: [
              Text(label, style: text.titleSmall),
              Text(
                '${sets(volume.currentSets)} hard sets',
                style: text.titleSmall,
              ),
            ],
          ),
          Text(
            'Previous: ${sets(volume.previousSets)} · change: $change',
            style: text.bodySmall,
          ),
          const SizedBox(height: 8),
          Semantics(
            label:
                '$label: ${sets(volume.currentSets)} current hard sets; '
                '${sets(volume.previousSets)} previous. Typical reference 10 to 20.',
            child: ExcludeSemantics(
              child: SizedBox(
                height: 16,
                child: LayoutBuilder(
                  builder: (context, constraints) => Stack(
                    children: [
                      Positioned.fill(
                        child: DecoratedBox(
                          decoration: BoxDecoration(color: context.mm.outline),
                        ),
                      ),
                      Positioned(
                        left: constraints.maxWidth * 10 / maximum,
                        width: constraints.maxWidth * 10 / maximum,
                        top: 0,
                        bottom: 0,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: context.mm.ion.withValues(alpha: 0.2),
                          ),
                        ),
                      ),
                      Positioned(
                        left: 0,
                        top: 5,
                        bottom: 5,
                        width:
                            constraints.maxWidth * volume.currentSets / maximum,
                        child: DecoratedBox(
                          decoration: BoxDecoration(color: context.mm.ion),
                        ),
                      ),
                      Positioned(
                        left:
                            (constraints.maxWidth *
                                    volume.previousSets /
                                    maximum)
                                .clamp(
                                  0,
                                  math.max(0, constraints.maxWidth - 2),
                                ),
                        width: 2,
                        top: 0,
                        bottom: 0,
                        child: DecoratedBox(
                          decoration: BoxDecoration(color: context.mm.text2),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
