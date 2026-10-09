import 'package:flutter/material.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import '../format/food_source_label.dart';
import '../format/trust_tier_label.dart';
import '../theme/mm_colors_context.dart';

/// Where a food's numbers came from and how far to trust them (MM-153): the
/// source in words and one quiet tier mark. A "Check this" food also gives its
/// reason. Nothing here is a score, and nothing is called verified.
class FoodTrustMark extends StatelessWidget {
  const FoodTrustMark({required this.food, super.key});

  final CatalogFood food;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme.bodySmall;
    final doubtful = food.tier == TrustTier.checkThis;
    final colors = context.mm;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text.rich(
          TextSpan(
            style: text?.copyWith(color: colors.text3),
            children: [
              TextSpan(text: '${food.sourceLabel} · '),
              TextSpan(
                text: food.tier.label,
                style: TextStyle(
                  color: doubtful ? colors.info : colors.text3,
                  fontWeight: doubtful ? FontWeight.w600 : null,
                ),
              ),
            ],
          ),
        ),
        if (doubtful)
          Text(food.tierReason, style: text?.copyWith(color: colors.text3)),
      ],
    );
  }
}
