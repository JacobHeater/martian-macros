import type { ComponentType } from 'react';
import AccessibilityNewOutlined from '@mui/icons-material/AccessibilityNewOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import BackHandOutlined from '@mui/icons-material/BackHandOutlined';
import BedtimeOutlined from '@mui/icons-material/BedtimeOutlined';
import BoltOutlined from '@mui/icons-material/BoltOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import ChecklistOutlined from '@mui/icons-material/ChecklistOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import CookieOutlined from '@mui/icons-material/CookieOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import DinnerDiningOutlined from '@mui/icons-material/DinnerDiningOutlined';
import DirectionsWalkOutlined from '@mui/icons-material/DirectionsWalkOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import EditNoteOutlined from '@mui/icons-material/EditNoteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined';
import FitnessCenterOutlined from '@mui/icons-material/FitnessCenterOutlined';
import FlagOutlined from '@mui/icons-material/FlagOutlined';
import FlightOutlined from '@mui/icons-material/FlightOutlined';
import FreeBreakfastOutlined from '@mui/icons-material/FreeBreakfastOutlined';
import HealthAndSafetyOutlined from '@mui/icons-material/HealthAndSafetyOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import LocalDiningOutlined from '@mui/icons-material/LocalDiningOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import LunchDiningOutlined from '@mui/icons-material/LunchDiningOutlined';
import MenuOutlined from '@mui/icons-material/MenuOutlined';
import MonitorWeightOutlined from '@mui/icons-material/MonitorWeightOutlined';
import MoreVertOutlined from '@mui/icons-material/MoreVertOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import PaletteOutlined from '@mui/icons-material/PaletteOutlined';
import PauseOutlined from '@mui/icons-material/PauseOutlined';
import PercentOutlined from '@mui/icons-material/PercentOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import PhotoLibraryOutlined from '@mui/icons-material/PhotoLibraryOutlined';
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';
import QrCodeScannerOutlined from '@mui/icons-material/QrCodeScannerOutlined';
import RadioButtonUncheckedOutlined from '@mui/icons-material/RadioButtonUncheckedOutlined';
import RemoveOutlined from '@mui/icons-material/RemoveOutlined';
import RestaurantMenuOutlined from '@mui/icons-material/RestaurantMenuOutlined';
import RestaurantOutlined from '@mui/icons-material/RestaurantOutlined';
import ScaleOutlined from '@mui/icons-material/ScaleOutlined';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import ScienceOutlined from '@mui/icons-material/ScienceOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import ShowChartOutlined from '@mui/icons-material/ShowChartOutlined';
import SickOutlined from '@mui/icons-material/SickOutlined';
import SpeedOutlined from '@mui/icons-material/SpeedOutlined';
import StarBorderOutlined from '@mui/icons-material/StarBorderOutlined';
import SquareFootOutlined from '@mui/icons-material/SquareFootOutlined';
import StraightenOutlined from '@mui/icons-material/StraightenOutlined';
import SummarizeOutlined from '@mui/icons-material/SummarizeOutlined';
import SyncOutlined from '@mui/icons-material/SyncOutlined';
import MobileScreenShareOutlined from '@mui/icons-material/MobileScreenShareOutlined';
import QrCode2Outlined from '@mui/icons-material/QrCode2Outlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import TimelapseOutlined from '@mui/icons-material/TimelapseOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import WaterDropOutlined from '@mui/icons-material/WaterDropOutlined';
import type { MmIconName } from './MmIconName';
import type { MmIconProps } from './MmIconProps';
import { ShakerBottleOutlined } from './ShakerBottleOutlined';

/**
 * Material's Outlined set behind the app's own names (MM-236): a standard
 * shape for every meaning, chosen here and nowhere else. Only this folder
 * imports the vendor package; screens say what an icon means, never which
 * glyph it is. The wayfinding names (MM-253) give every section, row and
 * state a mark until the app has art of its own (MM-109).
 */
export const mmIcons: Record<MmIconName, ComponentType<MmIconProps>> = {
  home: HomeOutlined,
  food: RestaurantOutlined,
  train: FitnessCenterOutlined,
  trend: ShowChartOutlined,
  coach: InsightsOutlined,
  settings: SettingsOutlined,
  back: ArrowBackOutlined,
  plus: AddOutlined,
  minus: RemoveOutlined,
  chevronDown: ExpandMoreOutlined,
  chevronLeft: ChevronLeftOutlined,
  chevronRight: ChevronRightOutlined,
  check: CheckOutlined,
  checkCircle: CheckCircleOutlined,
  info: InfoOutlined,
  warning: WarningAmberOutlined,
  shield: ShieldOutlined,
  more: MoreVertOutlined,
  close: CloseOutlined,
  edit: EditOutlined,
  delete: DeleteOutlined,
  search: SearchOutlined,
  barcode: QrCodeScannerOutlined,
  camera: PhotoCameraOutlined,
  play: PlayArrowOutlined,
  pause: PauseOutlined,
  timer: TimerOutlined,
  copy: ContentCopyOutlined,
  history: HistoryOutlined,
  download: DownloadOutlined,
  heart: FavoriteBorderOutlined,
  bell: NotificationsOutlined,
  person: PersonOutlineOutlined,
  breakfast: FreeBreakfastOutlined,
  lunch: LunchDiningOutlined,
  dinner: DinnerDiningOutlined,
  snack: CookieOutlined,
  scale: MonitorWeightOutlined,
  tape: StraightenOutlined,
  calendar: CalendarMonthOutlined,
  calendarCheck: EventAvailableOutlined,
  star: StarBorderOutlined,
  illness: SickOutlined,
  travel: FlightOutlined,
  creatine: ScienceOutlined,
  palette: PaletteOutlined,
  ruler: SquareFootOutlined,
  walk: DirectionsWalkOutlined,
  percent: PercentOutlined,
  health: HealthAndSafetyOutlined,
  sync: SyncOutlined,
  document: DescriptionOutlined,
  lock: LockOutlined,
  menu: MenuOutlined,
  insight: LightbulbOutlined,
  report: SummarizeOutlined,
  flag: FlagOutlined,
  body: AccessibilityNewOutlined,
  weighed: ScaleOutlined,
  serving: RestaurantMenuOutlined,
  measure: LocalDiningOutlined,
  hand: BackHandOutlined,
  estimate: EditNoteOutlined,
  checklist: ChecklistOutlined,
  bolt: BoltOutlined,
  speed: SpeedOutlined,
  tune: TuneOutlined,
  school: SchoolOutlined,
  dayUnmarked: RadioButtonUncheckedOutlined,
  dayComplete: TaskAltOutlined,
  dayPartial: TimelapseOutlined,
  water: WaterDropOutlined,
  // Drawn for the app: Material has no shaker (MM-335).
  protein: ShakerBottleOutlined,
  sleep: BedtimeOutlined,
  assistant: AutoAwesomeOutlined,
  photos: PhotoLibraryOutlined,
  movePhone: MobileScreenShareOutlined,
  qrCode: QrCode2Outlined,
};
