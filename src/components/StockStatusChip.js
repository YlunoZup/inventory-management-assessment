import { Chip, useTheme, alpha } from '@mui/material';
import {
  CheckCircle as AdequateIcon,
  Warning as LowIcon,
  Error as CriticalIcon,
  RemoveCircle as OutIcon,
  Info as OverstockedIcon,
} from '@mui/icons-material';
import { getStockStatus } from '@/utils/helpers';

export default function StockStatusChip({ quantity, reorderPoint, size = 'small' }) {
  const theme = useTheme();
  const { label, color, status } = getStockStatus(quantity, reorderPoint);

  const iconMap = {
    adequate: <AdequateIcon />,
    low: <LowIcon />,
    critical: <CriticalIcon />,
    out: <OutIcon />,
    overstocked: <OverstockedIcon />,
  };

  const colorMap = {
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const chipColor = colorMap[color];

  return (
    <Chip
      icon={iconMap[status]}
      label={label}
      size={size}
      sx={{
        bgcolor: alpha(chipColor, 0.1),
        color: chipColor,
        borderColor: alpha(chipColor, 0.3),
        border: '1px solid',
        fontWeight: 600,
        '& .MuiChip-icon': {
          color: chipColor,
        },
      }}
    />
  );
}
