import { onlineSourceName } from '../format/onlineSourceName';
import { onlineSourceNames } from '../format/onlineSourceNames';
import { fnddsCitation, usdaFdcCitation } from '../foodPipeline/packTerms';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { GroupHeader } from '../ui/GroupHeader';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { Notice } from '../ui/Notice';
import './foodPacks.css';

/**
 * Where the food data comes from and under what terms (MM-57), and what the
 * app sends online and to whom (MM-58): each source as one row (name, licence,
 * address; addresses are text, never links, so nothing opens a browser), the longer account as paragraphs under its group, and the privacy
 * sentence in body type where it is read first. Built like the Food database
 * screen beside it; the packs on the phone and the online choice have their
 * homes there and in Settings, so this screen does not repeat them.
 */
export function FoodSourcesScreen() {
  const { state } = useApp();
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
          subtitle="Public domain, with a citation requested · fdc.nal.usda.gov"
        />
        <MmListRow
          leadingIcon="document"
          title="Open Food Facts"
          subtitle="Database: Open Database License 1.0 (opendatacommons.org/licenses/odbl/1-0/) · contents: Database Contents License 1.0 (opendatacommons.org/licenses/dbcl/1-0/) · openfoodfacts.org"
        />
      </MmListGroup>
      <p className="app-text app-muted">
        FoodData Central is the US Department of Agriculture’s database: its Foundation Foods, SR Legacy, FNDDS survey
        foods and Branded Foods. USDA asks to be named as the source and, where possible, told of products that use its
        data. Open Food Facts is a collaborative database of packaged foods; its records are under the Database Contents
        License, and its product images are not used. The food databases the app carries and downloads are built from
        these sources and published under the Open Database License, with their attribution, at
        github.com/JacobHeater/martian-macros-food-data.
      </p>
      <GroupHeader text="Online lookup" />
      {sources.length === 0 ? (
        <Notice text="This version of the app has no online source, so nothing is ever sent." />
      ) : (
        <>
          <Notice
            text={
              `When a food is not on this phone and you allow it, the barcode number or the words you typed are sent to ` +
              `${onlineSourceNames(sources)}, and nothing about you. Those services see your IP address. A food found is kept ` +
              'on this phone. Whether to allow it is in Settings, under Data.'
            }
          />
          <div className="app-gap-small" />
          <MmListGroup>
            {sources.map((id) => (
              <MmListRow
                key={id}
                leadingIcon="search"
                title={onlineSourceName(id)}
                subtitle={id === 'off' ? 'Public API · world.openfoodfacts.org' : 'Public API · api.nal.usda.gov'}
              />
            ))}
          </MmListGroup>
        </>
      )}
      <GroupHeader text="Attribution" />
      <p className="app-text app-muted">
        Food data from Open Food Facts (openfoodfacts.org), available under the Open Database License
        (opendatacommons.org/licenses/odbl/1-0/), its records under the Database Contents License
        (opendatacommons.org/licenses/dbcl/1-0/), and from USDA FoodData Central (fdc.nal.usda.gov). FoodData Central is
        cited as USDA asks: {usdaFdcCitation} Its survey foods are cited as the Agricultural Research Service asks:{' '}
        {fnddsCitation}. The licensing reading behind this screen has not been reviewed by a lawyer.
      </p>
    </Screen>
  );
}
