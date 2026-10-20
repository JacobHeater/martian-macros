import type { DetailLevelReader } from './DetailLevelReader';
import type { DetailLevelWriter } from './DetailLevelWriter';
import type { EaseIntoMaintenanceReader } from './EaseIntoMaintenanceReader';
import type { EaseIntoMaintenanceWriter } from './EaseIntoMaintenanceWriter';
import type { EasyToMissReader } from './EasyToMissReader';
import type { EasyToMissWriter } from './EasyToMissWriter';
import type { ExactTargetsReader } from './ExactTargetsReader';
import type { ExactTargetsWriter } from './ExactTargetsWriter';
import type { InsightSwitchesReader } from './InsightSwitchesReader';
import type { InsightSwitchesWriter } from './InsightSwitchesWriter';
import type { LastBackupReader } from './LastBackupReader';
import type { LabelNoteReader } from './LabelNoteReader';
import type { LabelNoteWriter } from './LabelNoteWriter';
import type { LastBackupWriter } from './LastBackupWriter';
import type { MacroPictureReader } from './MacroPictureReader';
import type { MacroPictureWriter } from './MacroPictureWriter';
import type { NetCarbsReader } from './NetCarbsReader';
import type { NetCarbsWriter } from './NetCarbsWriter';
import type { NutritionGoalsReader } from './NutritionGoalsReader';
import type { NutritionGoalsWriter } from './NutritionGoalsWriter';
import type { PreferencesReader } from './PreferencesReader';
import type { PreferencesWriter } from './PreferencesWriter';
import type { RecoverySkipReader } from './RecoverySkipReader';
import type { RecoverySkipWriter } from './RecoverySkipWriter';
import type { ReturnScreenReader } from './ReturnScreenReader';
import type { ReturnScreenWriter } from './ReturnScreenWriter';
import type { TermsAcceptanceReader } from './TermsAcceptanceReader';
import type { TermsAcceptanceWriter } from './TermsAcceptanceWriter';
import type { UnderEatingNoticeReader } from './UnderEatingNoticeReader';
import type { UnderEatingNoticeWriter } from './UnderEatingNoticeWriter';

/**
 * Reads and writes display preferences. Not health data and not part of the
 * profile: it exists before onboarding.
 */
export interface PreferencesRepository
  extends PreferencesReader,
    PreferencesWriter,
    EasyToMissReader,
    EasyToMissWriter,
    DetailLevelReader,
    DetailLevelWriter,
    MacroPictureReader,
    MacroPictureWriter,
    NetCarbsReader,
    NetCarbsWriter,
    UnderEatingNoticeReader,
    UnderEatingNoticeWriter,
    ReturnScreenReader,
    ReturnScreenWriter,
    RecoverySkipReader,
    RecoverySkipWriter,
    TermsAcceptanceReader,
    TermsAcceptanceWriter,
    NutritionGoalsReader,
    NutritionGoalsWriter,
    InsightSwitchesReader,
    InsightSwitchesWriter,
    LastBackupReader,
    LastBackupWriter,
    ExactTargetsReader,
    ExactTargetsWriter,
    LabelNoteReader,
    LabelNoteWriter,
    EaseIntoMaintenanceReader,
    EaseIntoMaintenanceWriter {}
