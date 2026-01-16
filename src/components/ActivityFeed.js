import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Skeleton,
  Button,
  Divider,
  Badge,
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Inventory as InventoryIcon,
  Warehouse as WarehouseIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { formatRelativeTime, formatNumber, formatCurrency } from '@/utils/helpers';

// Activity types
const ACTIVITY_TYPES = {
  TRANSFER: 'transfer',
  STOCK_ADDED: 'stock_added',
  STOCK_UPDATED: 'stock_updated',
  PRODUCT_ADDED: 'product_added',
  PRODUCT_UPDATED: 'product_updated',
  LOW_STOCK_ALERT: 'low_stock_alert',
  WAREHOUSE_ADDED: 'warehouse_added',
};

// Activity colors and icons
const getActivityConfig = (type) => {
  switch (type) {
    case ACTIVITY_TYPES.TRANSFER:
      return {
        icon: TransferIcon,
        color: 'primary',
        label: 'Transfer',
      };
    case ACTIVITY_TYPES.STOCK_ADDED:
      return {
        icon: TrendingUpIcon,
        color: 'success',
        label: 'Stock Added',
      };
    case ACTIVITY_TYPES.STOCK_UPDATED:
      return {
        icon: InventoryIcon,
        color: 'info',
        label: 'Stock Updated',
      };
    case ACTIVITY_TYPES.PRODUCT_ADDED:
      return {
        icon: AddIcon,
        color: 'success',
        label: 'New Product',
      };
    case ACTIVITY_TYPES.PRODUCT_UPDATED:
      return {
        icon: EditIcon,
        color: 'info',
        label: 'Product Updated',
      };
    case ACTIVITY_TYPES.LOW_STOCK_ALERT:
      return {
        icon: WarningIcon,
        color: 'warning',
        label: 'Low Stock',
      };
    case ACTIVITY_TYPES.WAREHOUSE_ADDED:
      return {
        icon: WarehouseIcon,
        color: 'success',
        label: 'New Warehouse',
      };
    default:
      return {
        icon: InventoryIcon,
        color: 'default',
        label: 'Activity',
      };
  }
};

const ActivityItem = ({ activity }) => {
  const theme = useTheme();
  const config = getActivityConfig(activity.type);
  const Icon = config.icon;

  return (
    <ListItem
      alignItems="flex-start"
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 1,
        transition: 'background-color 0.2s',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: alpha(theme.palette[config.color].main, 0.1),
            color: theme.palette[config.color].main,
          }}
        >
          <Icon fontSize="small" />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" fontWeight={500}>
              {activity.title}
            </Typography>
            <Chip
              label={config.label}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                bgcolor: alpha(theme.palette[config.color].main, 0.1),
                color: theme.palette[config.color].main,
              }}
            />
          </Box>
        }
        secondary={
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary" component="span">
              {activity.description}
            </Typography>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {formatRelativeTime(activity.timestamp)}
            </Typography>
          </Box>
        }
      />
      {activity.value && (
        <Box sx={{ textAlign: 'right', ml: 2 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            color={activity.valueColor || 'text.primary'}
          >
            {activity.value}
          </Typography>
          {activity.subValue && (
            <Typography variant="caption" color="text.secondary">
              {activity.subValue}
            </Typography>
          )}
        </Box>
      )}
    </ListItem>
  );
};

const ActivitySkeleton = () => {
  return (
    <ListItem alignItems="flex-start" sx={{ px: 2, py: 1.5 }}>
      <ListItemAvatar>
        <Skeleton variant="circular" width={40} height={40} />
      </ListItemAvatar>
      <ListItemText
        primary={<Skeleton variant="text" width="60%" />}
        secondary={
          <>
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="30%" />
          </>
        }
      />
    </ListItem>
  );
};

export default function ActivityFeed({ maxItems = 5, compact = false }) {
  const theme = useTheme();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch transfers and create activity items
      const [transfersRes, productsRes, stockRes, warehousesRes] = await Promise.all([
        fetch('/api/transfers'),
        fetch('/api/products'),
        fetch('/api/stock'),
        fetch('/api/warehouses'),
      ]);

      if (!transfersRes.ok || !productsRes.ok || !stockRes.ok || !warehousesRes.ok) {
        throw new Error('Failed to fetch activity data');
      }

      const [transfers, products, stock, warehouses] = await Promise.all([
        transfersRes.json(),
        productsRes.json(),
        stockRes.json(),
        warehousesRes.json(),
      ]);

      // Generate activities from transfers
      const transferActivities = transfers.map((transfer) => ({
        id: `transfer-${transfer.id}`,
        type: ACTIVITY_TYPES.TRANSFER,
        title: `Stock Transfer #${transfer.id}`,
        description: `${formatNumber(transfer.quantity)} units of ${transfer.product?.name || 'Product'} moved from ${transfer.fromWarehouse?.name || 'Warehouse'} to ${transfer.toWarehouse?.name || 'Warehouse'}`,
        timestamp: transfer.createdAt,
        value: formatNumber(transfer.quantity),
        subValue: 'units',
      }));

      // Generate low stock alerts
      const lowStockActivities = stock
        .filter((s) => {
          const product = products.find((p) => p.id === s.productId);
          return product && s.quantity < product.reorderPoint;
        })
        .slice(0, 3)
        .map((s) => {
          const product = products.find((p) => p.id === s.productId);
          const warehouse = warehouses.find((w) => w.id === s.warehouseId);
          return {
            id: `alert-${s.id}`,
            type: ACTIVITY_TYPES.LOW_STOCK_ALERT,
            title: `Low Stock Alert`,
            description: `${product?.name || 'Product'} is running low at ${warehouse?.name || 'Warehouse'}`,
            timestamp: s.updatedAt || new Date().toISOString(),
            value: formatNumber(s.quantity),
            subValue: `/${product?.reorderPoint || 0}`,
            valueColor: 'warning.main',
          };
        });

      // Combine and sort all activities
      const allActivities = [...transferActivities, ...lowStockActivities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, maxItems * 2); // Get more than needed for variety

      setActivities(allActivities);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, [maxItems]);

  const displayedActivities = useMemo(() => {
    return activities.slice(0, maxItems);
  }, [activities, maxItems]);

  if (error) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={fetchActivities} sx={{ mt: 1 }}>
              Retry
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              Recent Activity
            </Typography>
            {!loading && activities.length > 0 && (
              <Badge badgeContent={activities.length} color="primary" max={99}>
                <Box />
              </Badge>
            )}
          </Box>
        }
        subheader="Latest inventory movements and alerts"
        action={
          <Tooltip title="Refresh">
            <IconButton
              onClick={fetchActivities}
              disabled={loading}
              aria-label="Refresh activity feed"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
        sx={{
          pb: 0,
          '& .MuiCardHeader-action': { alignSelf: 'center' },
        }}
      />
      <CardContent sx={{ pt: 1 }}>
        <List disablePadding>
          {loading ? (
            <>
              <ActivitySkeleton />
              <Divider component="li" />
              <ActivitySkeleton />
              <Divider component="li" />
              <ActivitySkeleton />
            </>
          ) : displayedActivities.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ShippingIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No recent activity</Typography>
              <Typography variant="caption" color="text.disabled">
                Activity will appear here as inventory changes
              </Typography>
            </Box>
          ) : (
            displayedActivities.map((activity, index) => (
              <Box key={activity.id}>
                {index > 0 && <Divider component="li" sx={{ my: 0.5 }} />}
                <ActivityItem activity={activity} />
              </Box>
            ))
          )}
        </List>

        {!loading && displayedActivities.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              size="small"
              component={Link}
              href="/transfers"
              sx={{ textTransform: 'none' }}
            >
              View all transfers
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
