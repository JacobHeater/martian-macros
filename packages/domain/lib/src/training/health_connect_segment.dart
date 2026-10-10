/// The strength movements Health Connect can name inside a workout: its
/// exercise segment types that a strength session accepts (MM-188).
///
/// Every [platformName] and [platformId] is the AndroidX client library's own
/// `EXERCISE_SEGMENT_TYPE_` constant, as checked in MM-188. A test compares
/// this list with that ticket's table; neither is to be edited from memory.
enum HealthConnectSegment {
  armCurl(1, 'ARM_CURL'),
  backExtension(2, 'BACK_EXTENSION'),
  ballSlam(3, 'BALL_SLAM'),
  barbellShoulderPress(4, 'BARBELL_SHOULDER_PRESS'),
  benchPress(5, 'BENCH_PRESS'),
  benchSitUp(6, 'BENCH_SIT_UP'),
  burpee(9, 'BURPEE'),
  crunch(10, 'CRUNCH'),
  deadlift(11, 'DEADLIFT'),
  doubleArmTricepsExtension(12, 'DOUBLE_ARM_TRICEPS_EXTENSION'),
  dumbbellCurlLeftArm(13, 'DUMBBELL_CURL_LEFT_ARM'),
  dumbbellCurlRightArm(14, 'DUMBBELL_CURL_RIGHT_ARM'),
  dumbbellFrontRaise(15, 'DUMBBELL_FRONT_RAISE'),
  dumbbellLateralRaise(16, 'DUMBBELL_LATERAL_RAISE'),
  dumbbellRow(17, 'DUMBBELL_ROW'),
  dumbbellTricepsExtensionLeftArm(18, 'DUMBBELL_TRICEPS_EXTENSION_LEFT_ARM'),
  dumbbellTricepsExtensionRightArm(19, 'DUMBBELL_TRICEPS_EXTENSION_RIGHT_ARM'),
  dumbbellTricepsExtensionTwoArm(20, 'DUMBBELL_TRICEPS_EXTENSION_TWO_ARM'),
  forwardTwist(22, 'FORWARD_TWIST'),
  frontRaise(23, 'FRONT_RAISE'),
  hipThrust(25, 'HIP_THRUST'),
  hulaHoop(26, 'HULA_HOOP'),
  jumpingJack(27, 'JUMPING_JACK'),
  jumpRope(28, 'JUMP_ROPE'),
  kettlebellSwing(29, 'KETTLEBELL_SWING'),
  lateralRaise(30, 'LATERAL_RAISE'),
  latPullDown(31, 'LAT_PULL_DOWN'),
  legCurl(32, 'LEG_CURL'),
  legExtension(33, 'LEG_EXTENSION'),
  legPress(34, 'LEG_PRESS'),
  legRaise(35, 'LEG_RAISE'),
  lunge(36, 'LUNGE'),
  mountainClimber(37, 'MOUNTAIN_CLIMBER'),
  plank(41, 'PLANK'),
  pullUp(42, 'PULL_UP'),
  punch(43, 'PUNCH'),
  shoulderPress(48, 'SHOULDER_PRESS'),
  singleArmTricepsExtension(49, 'SINGLE_ARM_TRICEPS_EXTENSION'),
  sitUp(50, 'SIT_UP'),
  squat(51, 'SQUAT'),
  upperTwist(63, 'UPPER_TWIST'),
  weightlifting(65, 'WEIGHTLIFTING');

  const HealthConnectSegment(this.platformId, this.platformName);

  /// The integer Health Connect stores for this segment type.
  final int platformId;

  /// The constant's name, without its `EXERCISE_SEGMENT_TYPE_` prefix.
  final String platformName;
}
