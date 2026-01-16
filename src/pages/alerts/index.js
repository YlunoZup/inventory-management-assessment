import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Chip,
  LinearProgress,
  TextField,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Collapse,
  Alert,
  AlertTitle,
  Divider,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ShoppingCart as OrderIcon,
  SwapHoriz as TransferIcon,
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  NotificationsActive as AlertIcon,
  NotificationsOff as DismissIcon,
  Inventory as InventoryIcon,
  ArrowForward as ArrowIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorDisplay from '@/components/ErrorDisplay';
import EmptyState from '@/components/EmptyState';
import StockStatusChip from '@/components/StockStatusChip';
import StatCard from '@/components/StatCard';
import { formatCurrency, formatNumber, generateCSV, downloadCSV } from '@/utils/helpers';
import { useDebounce } from '@/hooks/useDebounce';
import { PAGINATION } from '@/constants';

export default function AlertsPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  // Data states
  const [alertData, setAlertData] = useState({ alerts: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Sorting states
  const [orderBy, setOrderBy] = useState('severity');
  const [order, setOrder] = useState('desc');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.DEFAULT_ROWS_PER_PAGE);

  // Dialog states
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/alerts');
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      const data = await response.json();
      setAlertData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Handle acknowledge/dismiss actions
  const handleAlertAction = async (productId, action) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update alert');
      }

      enqueueSnackbar(
        action === 'acknowledge' ? 'Alert acknowledged' : 'Alert status updated',
        { variant: 'success' }
      );

      // Refresh alerts
      fetchAlerts();
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(alertData.alerts.map((a) => a.product.category))].sort();
  }, [alertData.alerts]);

  // Handle sorting
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
  };

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    let filtered = alertData.alerts;

    // Tab filter
    switch (tabValue) {
      case 0: // Needs Attention
        filtered = filtered.filter((a) => a.stockStatus.severity >= 2 && !a.acknowledged);
        break;
      case 1: // All Alerts
        break;
      case 2: // Critical
        filtered = filtered.filter(
          (a) => a.stockStatus.status === 'critical' || a.stockStatus.status === 'out'
        );
        break;
      case 3: // Low
        filtered = filtered.filter((a) => a.stockStatus.status === 'low');
        break;
      case 4: // Acknowledged
        filtered = filtered.filter((a) => a.acknowledged);
        break;
    }

    // Search filter
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.product.name.toLowerCase().includes(term) ||
          a.product.sku.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((a) => a.product.category === categoryFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case 'severity':
          aValue = a.stockStatus.severity;
          bValue = b.stockStatus.severity;
          break;
        case 'productName':
          aValue = a.product.name.toLowerCase();
          bValue = b.product.name.toLowerCase();
          break;
        case 'currentStock':
          aValue = a.currentStock;
          bValue = b.currentStock;
          break;
        case 'reorderPoint':
          aValue = a.product.reorderPoint;
          bValue = b.product.reorderPoint;
          break;
        case 'stockPercentage':
          aValue = a.currentStock / a.product.reorderPoint;
          bValue = b.currentStock / b.product.reorderPoint;
          break;
        case 'category':
          aValue = a.product.category.toLowerCase();
          bValue = b.product.category.toLowerCase();
          break;
        default:
          aValue = a[orderBy];
          bValue = b[orderBy];
      }

      if (typeof aValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [alertData.alerts, tabValue, debouncedSearch, categoryFilter, orderBy, order]);

  // Paginated alerts
  const paginatedAlerts = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAlerts.slice(start, start + rowsPerPage);
  }, [filteredAlerts, page, rowsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [tabValue, debouncedSearch, categoryFilter]);

  // Export alerts
  const handleExport = () => {
    const columns = [
      { label: 'SKU', getValue: (row) => row.product.sku },
      { label: 'Product', getValue: (row) => row.product.name },
      { label: 'Category', getValue: (row) => row.product.category },
      { label: 'Current Stock', key: 'currentStock' },
      { label: 'Reorder Point', getValue: (row) => row.product.reorderPoint },
      { label: 'Status', getValue: (row) => row.stockStatus.label },
      { label: 'Recommended Order', getValue: (row) => row.reorderRecommendation?.recommendedQuantity || 'N/A' },
      { label: 'Estimated Cost', getValue: (row) => row.reorderRecommendation ? formatCurrency(row.reorderRecommendation.estimatedCost) : 'N/A' },
      { label: 'Acknowledged', getValue: (row) => row.acknowledged ? 'Yes' : 'No' },
    ];
    const csv = generateCSV(filteredAlerts, columns);
    downloadCSV(csv, 'stock_alerts');
  };

  const openDetailDialog = (alert) => {
    setSelectedAlert(alert);
    setDetailDialogOpen(true);
  };

  const { summary } = alertData;
  const hasActiveFilters = searchTerm || categoryFilter;

  if (loading) {
    return (
      <Layout title="Stock Alerts">
        <LoadingScreen message="Loading alerts..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Stock Alerts">
        <ErrorDisplay title="Failed to load alerts" message={error} onRetry={fetchAlerts} />
      </Layout>
    );
  }

  return (
    <Layout title="Stock Alerts">
      {/* Summary Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Needs Attention"
            value={summary.needsAttention || 0}
            icon={WarningIcon}
            color="error"
            subtitle="Unacknowledged alerts"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Critical/Out"
            value={summary.critical || 0}
            icon={ErrorIcon}
            color="error"
            subtitle="Immediate action required"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Low Stock"
            value={summary.low || 0}
            icon={WarningIcon}
            color="warning"
            subtitle="Below reorder point"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Est. Reorder Cost"
            value={formatCurrency(summary.totalReorderValue || 0)}
            icon={OrderIcon}
            color="info"
            subtitle="To replenish all"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <CardHeader
          title="Inventory Alerts"
          subheader="Monitor and manage stock levels across all products"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchAlerts} aria-label="Refresh alerts">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export to CSV">
                <IconButton onClick={handleExport} disabled={filteredAlerts.length === 0} aria-label="Export to CSV">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 1, sm: 2 } }}>
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 56,
                px: { xs: 1.5, sm: 2 },
              },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Needs Attention</span>
                  {(summary.needsAttention || 0) > 0 && (
                    <Chip
                      label={summary.needsAttention}
                      size="small"
                      color="error"
                      sx={{ height: 20, minWidth: 28, fontSize: '0.75rem' }}
                    />
                  )}
                </Box>
              }
            />
            <Tab label={`All (${summary.total || 0})`} />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Critical/Out</span>
                  {(summary.critical || 0) > 0 && (
                    <Chip
                      label={summary.critical}
                      size="small"
                      color="error"
                      sx={{ height: 20, minWidth: 28, fontSize: '0.75rem' }}
                    />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Low Stock</span>
                  {(summary.low || 0) > 0 && (
                    <Chip
                      label={summary.low}
                      size="small"
                      color="warning"
                      sx={{ height: 20, minWidth: 28, fontSize: '0.75rem' }}
                    />
                  )}
                </Box>
              }
            />
            <Tab label="Acknowledged" />
          </Tabs>
        </Box>

        {/* Filters */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="category-filter-label">Category</InputLabel>
            <Select
              labelId="category-filter-label"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {hasActiveFilters && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} found
          </Typography>
        </Box>

        {/* Alert List */}
        {filteredAlerts.length === 0 ? (
          <CardContent>
            <EmptyState
              icon={CheckIcon}
              title={tabValue === 0 ? 'All clear!' : 'No alerts found'}
              message={
                tabValue === 0
                  ? 'All stock levels are healthy. No action required at this time.'
                  : 'No alerts match your current filters.'
              }
            />
          </CardContent>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'productName'}
                        direction={orderBy === 'productName' ? order : 'asc'}
                        onClick={() => handleRequestSort('productName')}
                      >
                        Product
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'category'}
                        direction={orderBy === 'category' ? order : 'asc'}
                        onClick={() => handleRequestSort('category')}
                      >
                        Category
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'currentStock'}
                        direction={orderBy === 'currentStock' ? order : 'asc'}
                        onClick={() => handleRequestSort('currentStock')}
                      >
                        Current Stock
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'reorderPoint'}
                        direction={orderBy === 'reorderPoint' ? order : 'asc'}
                        onClick={() => handleRequestSort('reorderPoint')}
                      >
                        Reorder Point
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'stockPercentage'}
                        direction={orderBy === 'stockPercentage' ? order : 'asc'}
                        onClick={() => handleRequestSort('stockPercentage')}
                      >
                        Stock Level
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'severity'}
                        direction={orderBy === 'severity' ? order : 'asc'}
                        onClick={() => handleRequestSort('severity')}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">Recommendation</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedAlerts.map((alert) => {
                    const stockPercentage = (alert.currentStock / alert.product.reorderPoint) * 100;
                    const progressColor =
                      alert.stockStatus.status === 'critical' || alert.stockStatus.status === 'out'
                        ? 'error'
                        : alert.stockStatus.status === 'low'
                        ? 'warning'
                        : alert.stockStatus.status === 'overstocked'
                        ? 'info'
                        : 'success';

                    return (
                      <TableRow
                        key={alert.productId}
                        sx={{
                          bgcolor: alert.acknowledged
                            ? 'transparent'
                            : alert.stockStatus.severity >= 3
                            ? alpha(theme.palette.error.main, 0.05)
                            : alert.stockStatus.severity >= 2
                            ? alpha(theme.palette.warning.main, 0.05)
                            : 'transparent',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {alert.acknowledged && (
                              <Tooltip title="Acknowledged">
                                <CheckIcon fontSize="small" color="success" />
                              </Tooltip>
                            )}
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {alert.product.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontFamily="monospace"
                              >
                                {alert.product.sku}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={alert.product.category} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600}>
                            {formatNumber(alert.currentStock)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(alert.product.reorderPoint)}
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 140 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(stockPercentage, 100)}
                              color={progressColor}
                              sx={{
                                flex: 1,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: alpha(theme.palette[progressColor].main, 0.1),
                              }}
                            />
                            <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>
                              {stockPercentage.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <StockStatusChip
                            quantity={alert.currentStock}
                            reorderPoint={alert.product.reorderPoint}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {alert.reorderRecommendation ? (
                            <Box>
                              <Typography variant="body2" fontWeight={600} color="primary.main">
                                Order {formatNumber(alert.reorderRecommendation.recommendedQuantity)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Est. {formatCurrency(alert.reorderRecommendation.estimatedCost)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No action needed
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => openDetailDialog(alert)} aria-label="View details">
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {alert.stockStatus.severity >= 2 && (
                              <Tooltip
                                title={alert.acknowledged ? 'Mark as unacknowledged' : 'Acknowledge'}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleAlertAction(
                                      alert.productId,
                                      alert.acknowledged ? 'unacknowledge' : 'acknowledge'
                                    )
                                  }
                                  color={alert.acknowledged ? 'success' : 'default'}
                                  aria-label={alert.acknowledged ? 'Mark as unacknowledged' : 'Acknowledge alert'}
                                >
                                  {alert.acknowledged ? (
                                    <CheckIcon fontSize="small" />
                                  ) : (
                                    <AlertIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                            {alert.reorderRecommendation && (
                              <Tooltip title="Create Transfer">
                                <IconButton
                                  size="small"
                                  component={Link}
                                  href={`/transfers?productId=${alert.productId}`}
                                  aria-label="Create transfer"
                                >
                                  <TransferIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredAlerts.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={PAGINATION.ROWS_PER_PAGE_OPTIONS}
            />
          </>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Alert Details
            <IconButton onClick={() => setDetailDialogOpen(false)} aria-label="Close dialog">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAlert && (
            <Grid container spacing={3}>
              {/* Product Info */}
              <Grid item xs={12} md={6}>
                <Typography variant="overline" color="text.secondary">
                  Product Information
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedAlert.product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                    {selectedAlert.product.sku}
                  </Typography>
                  <Chip
                    label={selectedAlert.product.category}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Unit Cost: {formatCurrency(selectedAlert.product.unitCost)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reorder Point: {formatNumber(selectedAlert.product.reorderPoint)} units
                  </Typography>
                </Box>
              </Grid>

              {/* Stock Status */}
              <Grid item xs={12} md={6}>
                <Typography variant="overline" color="text.secondary">
                  Current Stock Status
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h3" fontWeight={700}>
                      {formatNumber(selectedAlert.currentStock)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      units in stock
                    </Typography>
                  </Box>
                  <StockStatusChip
                    quantity={selectedAlert.currentStock}
                    reorderPoint={selectedAlert.product.reorderPoint}
                    size="medium"
                  />
                </Box>
              </Grid>

              {/* Warehouse Breakdown */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="overline" color="text.secondary">
                  Warehouse Breakdown
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Warehouse</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedAlert.warehouseBreakdown.map((wb) => (
                        <TableRow key={wb.warehouseId}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {wb.warehouseName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {wb.warehouseCode}
                            </Typography>
                          </TableCell>
                          <TableCell>{wb.warehouseLocation}</TableCell>
                          <TableCell align="right">{formatNumber(wb.quantity)}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(wb.quantity * selectedAlert.product.unitCost)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableCell colSpan={2}>
                          <Typography fontWeight={600}>Total</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600}>
                            {formatNumber(selectedAlert.currentStock)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600}>
                            {formatCurrency(
                              selectedAlert.currentStock * selectedAlert.product.unitCost
                            )}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Reorder Recommendation */}
              {selectedAlert.reorderRecommendation && (
                <Grid item xs={12}>
                  <Alert
                    severity={
                      selectedAlert.reorderRecommendation.urgency === 'critical'
                        ? 'error'
                        : 'warning'
                    }
                    sx={{ mt: 2 }}
                  >
                    <AlertTitle>Reorder Recommendation</AlertTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography variant="body2">
                          Recommended Order: <strong>{formatNumber(selectedAlert.reorderRecommendation.recommendedQuantity)} units</strong>
                        </Typography>
                        <Typography variant="body2">
                          Target Stock Level: <strong>{formatNumber(selectedAlert.reorderRecommendation.targetStock)} units</strong>
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2">
                          Estimated Cost: <strong>{formatCurrency(selectedAlert.reorderRecommendation.estimatedCost)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Priority: <strong style={{ textTransform: 'capitalize' }}>{selectedAlert.reorderRecommendation.urgency}</strong>
                        </Typography>
                      </Box>
                    </Box>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedAlert && selectedAlert.stockStatus.severity >= 2 && (
            <Button
              startIcon={selectedAlert.acknowledged ? <DismissIcon /> : <CheckIcon />}
              onClick={() => {
                handleAlertAction(
                  selectedAlert.productId,
                  selectedAlert.acknowledged ? 'unacknowledge' : 'acknowledge'
                );
                setDetailDialogOpen(false);
              }}
            >
              {selectedAlert.acknowledged ? 'Mark Unacknowledged' : 'Acknowledge'}
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<TransferIcon />}
            component={Link}
            href={`/transfers?productId=${selectedAlert?.productId}`}
          >
            Create Transfer
          </Button>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
