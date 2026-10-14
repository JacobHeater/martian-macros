import { Loadable } from '../state/Loadable';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useNavigator } from '../app/useNavigator';
import { MmListRow } from '../ui/MmListRow';
import { EvidenceQuestionScreen } from './EvidenceQuestionScreen';

/**
 * The questions a user might ask about how their numbers are made, each
 * answered from the evidence register (MM-143).
 */
export function HowThisWorksScreen() {
  const { state } = useApp();
  const navigator = useNavigator();
  const register = useCell(state.evidenceRegister);
  return (
    <Screen title="How this works">
      {Loadable.hasFailed(register) ? (
        <p className="app-text app-centered">This could not be loaded.</p>
      ) : !register.ready ? null : (
        <>
          <p className="app-text">
            Every number here comes from a rule. Each answer says how well supported the rule is, in words, and where
            it comes from.
          </p>
          {register.value.questions.map((question) => (
            <MmListRow
              key={question.title}
              title={question.title}
              opens
              onPress={() => void navigator.push(() => <EvidenceQuestionScreen question={question} />)}
            />
          ))}
        </>
      )}
    </Screen>
  );
}
