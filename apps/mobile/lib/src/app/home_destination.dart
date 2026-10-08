/// The main destinations, in navigation-bar order. Train joins between Food
/// and Progress when the training log exists.
enum HomeDestination {
  dashboard('Dashboard'),
  food('Food'),
  progress('Progress'),
  coach('Coach');

  const HomeDestination(this.label);

  final String label;
}
