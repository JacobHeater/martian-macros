import type { DetailLevelReader } from './DetailLevelReader';
import type { DetailLevelWriter } from './DetailLevelWriter';
import type { EasyToMissReader } from './EasyToMissReader';
import type { EasyToMissWriter } from './EasyToMissWriter';
import type { MacroPictureReader } from './MacroPictureReader';
import type { MacroPictureWriter } from './MacroPictureWriter';
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
    UnderEatingNoticeReader,
    UnderEatingNoticeWriter,
    ReturnScreenReader,
    ReturnScreenWriter,
    RecoverySkipReader,
    RecoverySkipWriter,
    TermsAcceptanceReader,
    TermsAcceptanceWriter {}
