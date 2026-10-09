import 'package:mm_food_catalog/mm_food_catalog.dart';

/// What went wrong with a food download, and what it means for the pack
/// already on the phone, in plain words.
String packDownloadProblemText(PackDownloadProblem problem) =>
    switch (problem) {
      PackDownloadProblem.connection =>
        'The connection dropped. What arrived is kept, so you can pick up '
            'where it stopped.',
      PackDownloadProblem.serverError =>
        'The host could not send the file right now. Try again later.',
      PackDownloadProblem.checksumMismatch =>
        'The file arrived damaged, so it was thrown away. Nothing on your '
            'phone changed.',
      PackDownloadProblem.unreadablePack =>
        'The file is not a food database this version of the app can read. '
            'Nothing on your phone changed.',
      PackDownloadProblem.noSpace =>
        'There was not enough room on the phone to store it. Free some space '
            'and try again.',
    };
