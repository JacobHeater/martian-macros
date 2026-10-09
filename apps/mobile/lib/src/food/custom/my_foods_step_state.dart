import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import '../../format/fmt.dart';
import '../../providers.dart';
import '../../repository_role_providers.dart';
import '../../ui/mm_button.dart';
import '../../ui/mm_button_kind.dart';
import '../../ui/mm_icon_button.dart';
import '../../ui/mm_list_row.dart';
import '../../ui/show_mm_confirm.dart';
import 'custom_food_form.dart';
import 'my_foods_page.dart';
import 'my_foods_step.dart';
import 'recipe_form.dart';

class MyFoodsStepState extends ConsumerState<MyFoodsStep> {
  var _page = MyFoodsPage.list;
  CustomFood? _editing;

  void _show(MyFoodsPage page, [CustomFood? editing]) => setState(() {
    _page = page;
    _editing = editing;
  });

  Future<void> _delete(CustomFood food) async {
    final ok = await showMmConfirm(
      context,
      title: 'Delete ${food.name}?',
      message:
          'Entries you already logged from it stay as they are. This only '
          'removes it from your saved foods.',
      confirmLabel: 'Delete',
    );
    if (ok) await ref.read(customFoodWriterProvider).deleteCustomFood(food.id);
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    switch (_page) {
      case MyFoodsPage.foodForm:
        return CustomFoodForm(
          food: _editing,
          onDone: () => _show(MyFoodsPage.list),
        );
      case MyFoodsPage.recipeForm:
        return RecipeForm(
          recipe: _editing,
          onDone: () => _show(MyFoodsPage.list),
        );
      case MyFoodsPage.list:
        final foods = ref.watch(customFoodsProvider).value ?? const [];
        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('My foods', style: text.titleLarge),
            const SizedBox(height: 4),
            Text(
              'Foods and recipes you save appear first when you search.',
              style: text.bodySmall,
            ),
            const SizedBox(height: 8),
            if (foods.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text('Nothing saved yet.', style: text.bodyMedium),
              ),
            for (final f in foods)
              MmListRow(
                key: ValueKey('my-food-${f.id}'),
                title: f.name,
                subtitle:
                    '${f.kind == CustomFoodKind.recipe ? 'Recipe' : 'Food'} · '
                    '${f.servingDescription} · ${Fmt.kcal(f.perServing.kcal)}',
                onTap: () => _show(
                  f.kind == CustomFoodKind.recipe
                      ? MyFoodsPage.recipeForm
                      : MyFoodsPage.foodForm,
                  f,
                ),
                trailing: MmIconButton(
                  tooltip: 'Delete ${f.name}',
                  icon: Icons.delete_outline,
                  onPressed: () => _delete(f),
                ),
              ),
            const SizedBox(height: 8),
            MmButton(
              key: const ValueKey('new-custom-food'),
              label: 'New food',
              kind: MmButtonKind.secondary,
              icon: Icons.add,
              expand: true,
              onPressed: () => _show(MyFoodsPage.foodForm),
            ),
            const SizedBox(height: 8),
            MmButton(
              key: const ValueKey('new-recipe'),
              label: 'New recipe',
              kind: MmButtonKind.secondary,
              icon: Icons.add,
              expand: true,
              onPressed: () => _show(MyFoodsPage.recipeForm),
            ),
            MmButton(
              label: 'Back',
              kind: MmButtonKind.text,
              onPressed: widget.onBack,
            ),
          ],
        );
    }
  }
}
