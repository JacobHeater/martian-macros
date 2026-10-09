import 'package:martian_macros/src/food_packs/pack_download_controller.dart';
import 'package:martian_macros/src/food_packs/pack_download_state.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

/// A stand-in for the download controller: starts in a chosen state and records
/// what the screen asks of it, without touching a file or the network.
class FakePackDownloadController extends PackDownloadController {
  FakePackDownloadController(this.initial);

  final PackDownloadState initial;
  var cancelled = 0;
  var discarded = 0;
  final started = <PackListing>[];

  @override
  PackDownloadState build() => initial;

  @override
  Future<void> start(PackListing listing) async => started.add(listing);

  @override
  void cancel() => cancelled++;

  @override
  Future<void> discard() async => discarded++;
}
