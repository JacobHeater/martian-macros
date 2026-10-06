import 'biological_sex.dart';
import 'calendar_date.dart';

/// The user's stable physiological identity.
final class Profile {
  Profile({
    required this.sex,
    required this.birthDate,
    required this.heightCm,
  }) {
    if (heightCm < 100 || heightCm > 250) {
      throw ArgumentError.value(heightCm, 'heightCm', 'Must be 100–250 cm');
    }
  }

  final BiologicalSex sex;
  final CalendarDate birthDate;
  final double heightCm;

  /// Completed years of age on [date].
  int ageOn(CalendarDate date) {
    var age = date.year - birthDate.year;
    final hadBirthday =
        date.month > birthDate.month ||
        (date.month == birthDate.month && date.day >= birthDate.day);
    if (!hadBirthday) age--;
    return age;
  }

  /// The app is 18+ only; see `CoachingPolicy`.
  bool isAdultOn(CalendarDate date) => ageOn(date) >= 18;
}
