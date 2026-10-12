import AddOutlined from '@mui/icons-material/AddOutlined';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined';
import FitnessCenterOutlined from '@mui/icons-material/FitnessCenterOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import InsightsOutlined from '@mui/icons-material/InsightsOutlined';
import MoreVertOutlined from '@mui/icons-material/MoreVertOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import PauseOutlined from '@mui/icons-material/PauseOutlined';
import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import PhotoCameraOutlined from '@mui/icons-material/PhotoCameraOutlined';
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';
import QrCodeScannerOutlined from '@mui/icons-material/QrCodeScannerOutlined';
import RemoveOutlined from '@mui/icons-material/RemoveOutlined';
import RestaurantOutlined from '@mui/icons-material/RestaurantOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import ShieldOutlined from '@mui/icons-material/ShieldOutlined';
import ShowChartOutlined from '@mui/icons-material/ShowChartOutlined';
import TimerOutlined from '@mui/icons-material/TimerOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import type { MmIconName } from './MmIconName';

/**
 * Material's Outlined set behind the app's own names (MM-236): a standard
 * shape for every meaning, chosen here and nowhere else. Only this folder
 * imports the vendor package; screens say what an icon means, never which
 * glyph it is.
 */
export const mmIcons: Record<MmIconName, typeof AddOutlined> = {
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
};
