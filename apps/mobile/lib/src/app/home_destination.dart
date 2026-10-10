/// The main destinations, in navigation-bar order.
enum HomeDestination {
  dashboard('Dashboard'),
  food('Food'),
  train('Train'),
  progress('Progress'),
  coach('Coach');

  const HomeDestination(this.label);

  final String label;
}
