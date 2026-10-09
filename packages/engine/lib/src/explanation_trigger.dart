/// What caused targets to be issued, which names the leftover cause of a
/// change once expenditure and the limits are accounted for.
enum ExplanationTrigger {
  firstTargets,
  checkIn,
  goalChange,
  profileCorrection,
  appRuleUpdate,
  healthRule,
  underweightRule,
  bodyFatCorrection,
}
