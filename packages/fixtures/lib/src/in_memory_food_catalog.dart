import 'package:mm_domain/mm_domain.dart';

/// A [FoodSearch] and [FoodBarcodeLookup] over a list of items in memory.
/// Script it to fail with [failWith] to test offline and denied paths.
final class InMemoryFoodCatalog implements FoodSearch, FoodBarcodeLookup {
  InMemoryFoodCatalog(this._items);

  final List<FoodItem> _items;
  Outcome<Never>? _failure;

  /// Every following call answers with this failure ([Unavailable] or
  /// [Denied]) until [recover] is called.
  void failWith(Outcome<Never> failure) => _failure = failure;

  void recover() => _failure = null;

  @override
  Future<Outcome<List<FoodItem>>> search(String query, {int limit = 25}) async {
    final failure = _failure;
    if (failure != null) return _failed(failure);
    final needle = query.trim().toLowerCase();
    if (needle.isEmpty) return const Succeeded([]);
    final hits = [
      for (final item in _items)
        if (item.name.toLowerCase().contains(needle) ||
            (item.brand?.toLowerCase().contains(needle) ?? false))
          item,
    ];
    return Succeeded(hits.take(limit).toList());
  }

  @override
  Future<Outcome<FoodItem>> lookup(String gtin14) async {
    final failure = _failure;
    if (failure != null) return _failed(failure);
    for (final item in _items) {
      if (item.barcode == gtin14) return Succeeded(item);
    }
    return const NotFound();
  }

  Outcome<T> _failed<T>(Outcome<Never> failure) => switch (failure) {
    Unavailable(:final message) => Unavailable<T>(message),
    Denied(:final message) => Denied<T>(message),
    _ => throw StateError('failWith needs an Unavailable or a Denied'),
  };
}
