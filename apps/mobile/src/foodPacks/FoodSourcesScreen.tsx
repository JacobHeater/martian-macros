import { onlineLookupChoiceLabel } from '../format/onlineLookupChoiceLabel';
import { onlineSourceName } from '../format/onlineSourceName';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { Loadable } from '../state/Loadable';
import { GroupHeader } from '../ui/GroupHeader';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import './foodPacks.css';

/**
 * Where the food data comes from and under what terms (MM-57), and what the
 * app sends online and to whom (MM-58): each source, its licence and its
 * address, as the licences ask. Built like the Food database screen beside
 * it: rows in groups under a short account.
 */
export function FoodSourcesScreen() {
  const { state } = useApp();
  const installed = useLoaded(state.installedPacks) ?? [];
  const choice = Loadable.valueOf(useCell(state.onlineLookup.choice)) ?? 'ask';
  const sources = state.onlineLookup.sourceIds;
  return (
    <Screen title="Food data sources">
      <p className="app-text app-muted">
        The foods the app knows come from public databases, gathered by public bodies and by volunteers. They can be
        wrong, which is why each food says where it came from. Foods you create are yours and are not part of any
        published database.
      </p>
      <GroupHeader text="The sources" />
      <MmListGroup>
        <MmListRow
          leadingIcon="document"
          title="USDA FoodData Central"
          subtitle="Foundation Foods, SR Legacy, FNDDS survey foods and Branded Foods. US Department of Agriculture. Public domain; USDA asks to be named as the source. fdc.nal.usda.gov"
        />
        <MmListRow
          leadingIcon="document"
          title="Open Food Facts"
          subtitle="A collaborative database of packaged foods. Open Database License 1.0 for the database, Database Contents License for its records; product images are not used. openfoodfacts.org"
        />
      </MmListGroup>
      <GroupHeader text="On this phone" />
      <MmListGroup>
        {installed.length === 0 ? (
          <MmListRow leadingIcon="info" title="No food database downloaded" subtitle="Settings, Data, Food database offers one." />
        ) : (
          installed.map((pack) => (
            <MmListRow key={pack.id} leadingIcon="download" title={pack.title ?? pack.id} subtitle={`Version ${pack.version}`} />
          ))
        )}
        <MmListRow
          leadingIcon="document"
          title="The published files"
          subtitle="The databases the app downloads are built from those sources and published under the Open Database License, with their attribution, at github.com/JacobHeater/martian-macros-food-data."
        />
      </MmListGroup>
      <GroupHeader text="Online lookup" />
      <MmListGroup>
        <MmListRow
          leadingIcon="search"
          title="Looking foods up online"
          subtitle={`${onlineLookupChoiceLabel(choice)}. ${
            sources.length === 0
              ? 'This version of the app has no online source, so nothing is ever sent.'
              : `When a food is not on this phone and you allow it, the barcode number or the words you typed are sent to ${sources
                  .map(onlineSourceName)
                  .join(' and ')}, and nothing about you. Those services see your IP address. A food found is kept on this phone.`
          }`}
        />
        {sources.map((id) => (
          <MmListRow
            key={id}
            leadingIcon="document"
            title={onlineSourceName(id)}
            subtitle={
              id === 'off'
                ? 'world.openfoodfacts.org, its public API. Products found are under the same licences as above.'
                : 'api.nal.usda.gov, its public API. Foods found are public domain.'
            }
          />
        ))}
      </MmListGroup>
      <GroupHeader text="Attribution" />
      <p className="app-text app-muted">
        Food data from Open Food Facts (openfoodfacts.org), available under the Open Database License, and from USDA
        FoodData Central (fdc.nal.usda.gov), US Department of Agriculture, Agricultural Research Service, including the
        USDA Food and Nutrient Database for Dietary Studies 2021-2023. The licensing reading behind this screen has not
        been reviewed by a lawyer.
      </p>
    </Screen>
  );
}
