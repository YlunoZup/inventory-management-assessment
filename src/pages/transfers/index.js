import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  Alert,
  AlertTitle,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  InputAdornment,
  Collapse,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
  ArrowForward as ArrowIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorDisplay from '@/components/ErrorDisplay';
import EmptyState from '@/components/EmptyState';
import StatCard from '@/components/StatCard';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime, generateCSV, downloadCSV } from '@/utils/helpers';
import { useDebounce } from '@/hooks/useDebounce';
import { PAGINATION } from '@/constants';

export default function TransfersPage() {
  const theme = useTheme();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  // Data states
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stock, setStock] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialProductSet, setInitialProductSet] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    productId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formExpanded, setFormExpanded] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Sorting states
  const [orderBy, setOrderBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.DEFAULT_ROWS_PER_PAGE);

  // Detail dialog
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, warehousesRes, stockRes, transfersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/warehouses'),
        fetch('/api/stock'),
        fetch('/api/transfers'),
      ]);

      if (!productsRes.ok || !warehousesRes.ok || !stockRes.ok || !transfersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [productsData, warehousesData, stockData, transfersData] = await Promise.all([
        productsRes.json(),
        warehousesRes.json(),
        stockRes.json(),
        transfersRes.json(),
      ]);

      setProducts(productsData);
      setWarehouses(warehousesData);
      setStock(stockData);
      setTransfers(transfersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-fill product from query parameter (from alerts page)
  useEffect(() => {
    if (!initialProductSet && router.isReady && router.query.productId && products.length > 0) {
      const productId = router.query.productId;
      const productExists = products.some((p) => p.id === parseInt(productId));
      if (productExists) {
        setFormData((prev) => ({ ...prev, productId }));
        setInitialProductSet(true);
      }
    }
  }, [router.isReady, router.query.productId, products, initialProductSet]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayTransfers = transfers.filter(t => {
      const date = new Date(t.createdAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === today.getTime();
    });

    const weekTransfers = transfers.filter(t => new Date(t.createdAt) >= thisWeekStart);
    const monthTransfers = transfers.filter(t => new Date(t.createdAt) >= thisMonthStart);

    const totalQuantity = transfers.reduce((sum, t) => sum + t.quantity, 0);
    const totalValue = transfers.reduce((sum, t) => {
      const product = products.find(p => p.id === t.productId);
      return sum + (t.quantity * (product?.unitCost || 0));
    }, 0);

    return {
      todayCount: todayTransfers.length,
      weekCount: weekTransfers.length,
      monthCount: monthTransfers.length,
      totalTransfers: transfers.length,
      totalQuantity,
      totalValue,
    };
  }, [transfers, products]);

  // Get available stock for selected product at source warehouse
  const getAvailableStock = () => {
    if (!formData.productId || !formData.fromWarehouseId) return null;
    const stockRecord = stock.find(
      (s) =>
        s.productId === parseInt(formData.productId) &&
        s.warehouseId === parseInt(formData.fromWarehouseId)
    );
    return stockRecord ? stockRecord.quantity : 0;
  };

  // Get warehouses that have stock for selected product
  const getWarehousesWithStock = () => {
    if (!formData.productId) return warehouses;
    const warehouseIds = stock
      .filter((s) => s.productId === parseInt(formData.productId) && s.quantity > 0)
      .map((s) => s.warehouseId);
    return warehouses.filter((w) => warehouseIds.includes(w.id));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    const availableStock = getAvailableStock();

    if (!formData.productId) {
      errors.productId = 'Please select a product';
    }
    if (!formData.fromWarehouseId) {
      errors.fromWarehouseId = 'Please select source warehouse';
    }
    if (!formData.toWarehouseId) {
      errors.toWarehouseId = 'Please select destination warehouse';
    }
    if (formData.fromWarehouseId && formData.toWarehouseId && formData.fromWarehouseId === formData.toWarehouseId) {
      errors.toWarehouseId = 'Destination must be different from source';
    }
    if (!formData.quantity) {
      errors.quantity = 'Please enter quantity';
    } else if (parseInt(formData.quantity) <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    } else if (availableStock !== null && parseInt(formData.quantity) > availableStock) {
      errors.quantity = `Only ${formatNumber(availableStock)} units available`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create transfer');
      }

      // Success
      enqueueSnackbar('Transfer completed successfully!', { variant: 'success' });

      // Reset form
      setFormData({
        productId: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        quantity: '',
        notes: '',
      });
      setFormErrors({});

      // Refresh data
      fetchData();
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form field change
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Reset dependent fields
      if (field === 'productId') {
        newData.fromWarehouseId = '';
        newData.toWarehouseId = '';
        newData.quantity = '';
      }
      if (field === 'fromWarehouseId') {
        newData.quantity = '';
      }

      return newData;
    });

    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

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
    setFilterProduct('');
    setFilterWarehouse('');
    setFilterStatus('');
  };

  // Filter and sort transfers
  const filteredTransfers = useMemo(() => {
    let filtered = transfers.filter((transfer) => {
      const matchesSearch =
        !debouncedSearch ||
        transfer.product?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        transfer.product?.sku?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        transfer.fromWarehouse?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        transfer.toWarehouse?.name?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesProduct = !filterProduct || transfer.productId === parseInt(filterProduct);
      const matchesWarehouse = !filterWarehouse ||
        transfer.fromWarehouseId === parseInt(filterWarehouse) ||
        transfer.toWarehouseId === parseInt(filterWarehouse);
      const matchesStatus = !filterStatus || transfer.status === filterStatus;

      return matchesSearch && matchesProduct && matchesWarehouse && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'productName':
          aValue = a.product?.name?.toLowerCase() || '';
          bValue = b.product?.name?.toLowerCase() || '';
          break;
        case 'fromWarehouse':
          aValue = a.fromWarehouse?.name?.toLowerCase() || '';
          bValue = b.fromWarehouse?.name?.toLowerCase() || '';
          break;
        case 'toWarehouse':
          aValue = a.toWarehouse?.name?.toLowerCase() || '';
          bValue = b.toWarehouse?.name?.toLowerCase() || '';
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
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
  }, [transfers, debouncedSearch, filterProduct, filterWarehouse, filterStatus, orderBy, order]);

  // Paginated transfers
  const paginatedTransfers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredTransfers.slice(start, start + rowsPerPage);
  }, [filteredTransfers, page, rowsPerPage]);

  // Export transfers
  const handleExport = () => {
    const columns = [
      { label: 'Date', getValue: (row) => formatDate(row.createdAt) },
      { label: 'Product', getValue: (row) => row.product?.name || 'Unknown' },
      { label: 'SKU', getValue: (row) => row.product?.sku || '' },
      { label: 'From', getValue: (row) => row.fromWarehouse?.name || 'Unknown' },
      { label: 'To', getValue: (row) => row.toWarehouse?.name || 'Unknown' },
      { key: 'quantity', label: 'Quantity' },
      { label: 'Value', getValue: (row) => {
        const product = products.find(p => p.id === row.productId);
        return formatCurrency(row.quantity * (product?.unitCost || 0));
      }},
      { key: 'status', label: 'Status' },
      { key: 'notes', label: 'Notes' },
    ];
    const csv = generateCSV(filteredTransfers, columns);
    downloadCSV(csv, 'transfer_history');
  };

  const availableStock = getAvailableStock();
  const warehousesWithStock = getWarehousesWithStock();
  const hasActiveFilters = searchTerm || filterProduct || filterWarehouse || filterStatus;

  if (loading) {
    return (
      <Layout title="Stock Transfers">
        <LoadingScreen message="Loading transfer data..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Stock Transfers">
        <ErrorDisplay title="Failed to load transfers" message={error} onRetry={fetchData} />
      </Layout>
    );
  }

  return (
    <Layout title="Stock Transfers">
      {/* Summary Statistics */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Today's Transfers"
            value={summaryStats.todayCount}
            icon={TransferIcon}
            color="primary"
            subtitle="Completed today"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="This Week"
            value={summaryStats.weekCount}
            icon={TimelineIcon}
            color="info"
            subtitle="Last 7 days"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Units Moved"
            value={formatNumber(summaryStats.totalQuantity)}
            icon={InventoryIcon}
            color="success"
            subtitle="All time"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Value Moved"
            value={formatCurrency(summaryStats.totalValue)}
            icon={TrendingIcon}
            color="warning"
            subtitle="All transfers"
          />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Transfer Form */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="New Stock Transfer"
              subheader="Move inventory between warehouse locations"
              avatar={<TransferIcon color="primary" />}
              action={
                <IconButton onClick={() => setFormExpanded(!formExpanded)} aria-label={formExpanded ? 'Collapse form' : 'Expand form'}>
                  {formExpanded ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
              }
            />
            <Collapse in={formExpanded}>
              <CardContent>
                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    {/* Product Selection */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth error={!!formErrors.productId}>
                        <InputLabel id="product-label">Product</InputLabel>
                        <Select
                          labelId="product-label"
                          value={formData.productId}
                          onChange={handleChange('productId')}
                          label="Product"
                          disabled={submitting}
                        >
                          <MenuItem value="" disabled>
                            <em>Select a product to transfer</em>
                          </MenuItem>
                          {products.map((product) => (
                            <MenuItem key={product.id} value={product.id}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <span>{product.name}</span>
                                <Typography variant="caption" color="text.secondary">
                                  {product.sku}
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        {formErrors.productId && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                            {formErrors.productId}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Quantity */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantity"
                        value={formData.quantity}
                        onChange={handleChange('quantity')}
                        error={!!formErrors.quantity}
                        helperText={
                          formErrors.quantity ||
                          (availableStock !== null
                            ? `Available: ${formatNumber(availableStock)} units`
                            : 'Select product and source warehouse first')
                        }
                        disabled={submitting || !formData.productId || !formData.fromWarehouseId}
                        inputProps={{ min: 1, max: availableStock || undefined }}
                        InputProps={{
                          endAdornment: availableStock !== null && (
                            <InputAdornment position="end">
                              <Button
                                size="small"
                                onClick={() =>
                                  setFormData((prev) => ({ ...prev, quantity: String(availableStock) }))
                                }
                                disabled={submitting || availableStock === 0}
                              >
                                Max
                              </Button>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    {/* Source Warehouse */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth error={!!formErrors.fromWarehouseId} disabled={submitting || !formData.productId}>
                        <InputLabel id="from-warehouse-label">From Warehouse (Source)</InputLabel>
                        <Select
                          labelId="from-warehouse-label"
                          value={formData.fromWarehouseId}
                          onChange={handleChange('fromWarehouseId')}
                          label="From Warehouse (Source)"
                        >
                          <MenuItem value="" disabled>
                            <em>{!formData.productId ? 'Select a product first' : 'Select source warehouse'}</em>
                          </MenuItem>
                          {warehousesWithStock.map((warehouse) => {
                            const stockQty =
                              stock.find(
                                (s) =>
                                  s.productId === parseInt(formData.productId) &&
                                  s.warehouseId === warehouse.id
                              )?.quantity || 0;
                            return (
                              <MenuItem key={warehouse.id} value={warehouse.id}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                  <span>{warehouse.name}</span>
                                  <Chip
                                    label={`${formatNumber(stockQty)} units`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                </Box>
                              </MenuItem>
                            );
                          })}
                        </Select>
                        {formErrors.fromWarehouseId && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                            {formErrors.fromWarehouseId}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Destination Warehouse */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth error={!!formErrors.toWarehouseId} disabled={submitting || !formData.fromWarehouseId}>
                        <InputLabel id="to-warehouse-label">To Warehouse (Destination)</InputLabel>
                        <Select
                          labelId="to-warehouse-label"
                          value={formData.toWarehouseId}
                          onChange={handleChange('toWarehouseId')}
                          label="To Warehouse (Destination)"
                        >
                          <MenuItem value="" disabled>
                            <em>Select destination warehouse</em>
                          </MenuItem>
                          {warehouses
                            .filter((w) => w.id !== parseInt(formData.fromWarehouseId))
                            .map((warehouse) => (
                              <MenuItem key={warehouse.id} value={warehouse.id}>
                                <Box>
                                  <Typography>{warehouse.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {warehouse.location}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                        </Select>
                        {formErrors.toWarehouseId && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                            {formErrors.toWarehouseId}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Notes */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Notes (Optional)"
                        value={formData.notes}
                        onChange={handleChange('notes')}
                        placeholder="Add any notes about this transfer..."
                        disabled={submitting}
                      />
                    </Grid>

                    {/* Submit Button */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          onClick={() =>
                            setFormData({
                              productId: '',
                              fromWarehouseId: '',
                              toWarehouseId: '',
                              quantity: '',
                              notes: '',
                            })
                          }
                          disabled={submitting}
                          sx={{ order: { xs: 2, sm: 1 }, width: { xs: '100%', sm: 'auto' } }}
                        >
                          Clear
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          startIcon={<TransferIcon />}
                          disabled={submitting}
                          sx={{ order: { xs: 1, sm: 2 }, width: { xs: '100%', sm: 'auto' } }}
                        >
                          {submitting ? 'Processing...' : 'Complete Transfer'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Collapse>
          </Card>
        </Grid>

        {/* Transfer History */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Transfer History"
              subheader={`${filteredTransfers.length} transfers found`}
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Refresh">
                    <IconButton onClick={fetchData} aria-label="Refresh data">
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export to CSV">
                    <IconButton onClick={handleExport} disabled={filteredTransfers.length === 0} aria-label="Export to CSV">
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />

            {/* Filters */}
            <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Search transfers..."
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
                sx={{ width: { xs: '100%', sm: 220 }, flexGrow: { xs: 1, sm: 0 } }}
              />
              <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 4px)', sm: 150 } }}>
                <InputLabel id="filter-product-label">Product</InputLabel>
                <Select
                  labelId="filter-product-label"
                  value={filterProduct}
                  onChange={(e) => setFilterProduct(e.target.value)}
                  label="Product"
                >
                  <MenuItem value="">All Products</MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 4px)', sm: 150 } }}>
                <InputLabel id="filter-warehouse-label">Warehouse</InputLabel>
                <Select
                  labelId="filter-warehouse-label"
                  value={filterWarehouse}
                  onChange={(e) => setFilterWarehouse(e.target.value)}
                  label="Warehouse"
                >
                  <MenuItem value="">All Warehouses</MenuItem>
                  {warehouses.map((wh) => (
                    <MenuItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {hasActiveFilters && (
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  sx={{ ml: { xs: 'auto', sm: 0 } }}
                >
                  Clear
                </Button>
              )}
            </Box>

            {filteredTransfers.length === 0 ? (
              <CardContent>
                <EmptyState
                  icon={TransferIcon}
                  title="No transfers found"
                  message={
                    transfers.length === 0
                      ? 'No stock transfers have been made yet. Use the form above to create your first transfer.'
                      : 'No transfers match your search criteria.'
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
                            active={orderBy === 'createdAt'}
                            direction={orderBy === 'createdAt' ? order : 'asc'}
                            onClick={() => handleRequestSort('createdAt')}
                          >
                            Date
                          </TableSortLabel>
                        </TableCell>
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
                            active={orderBy === 'fromWarehouse'}
                            direction={orderBy === 'fromWarehouse' ? order : 'asc'}
                            onClick={() => handleRequestSort('fromWarehouse')}
                          >
                            From
                          </TableSortLabel>
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={orderBy === 'toWarehouse'}
                            direction={orderBy === 'toWarehouse' ? order : 'asc'}
                            onClick={() => handleRequestSort('toWarehouse')}
                          >
                            To
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">
                          <TableSortLabel
                            active={orderBy === 'quantity'}
                            direction={orderBy === 'quantity' ? order : 'asc'}
                            onClick={() => handleRequestSort('quantity')}
                          >
                            Quantity
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedTransfers.map((transfer) => {
                        const product = products.find(p => p.id === transfer.productId);
                        const transferValue = transfer.quantity * (product?.unitCost || 0);

                        return (
                          <TableRow
                            key={transfer.id}
                            sx={{
                              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2">{formatRelativeTime(transfer.createdAt)}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(transfer.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {transfer.product?.name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                {transfer.product?.sku}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{transfer.fromWarehouse?.name || 'Unknown'}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {transfer.fromWarehouse?.code}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ px: 1 }}>
                              <ArrowIcon color="action" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{transfer.toWarehouse?.name || 'Unknown'}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {transfer.toWarehouse?.code}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600}>
                                {formatNumber(transfer.quantity)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="text.secondary">
                                {formatCurrency(transferValue)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={<CheckIcon />}
                                label={transfer.status || 'Completed'}
                                size="small"
                                color="success"
                                sx={{
                                  bgcolor: alpha(theme.palette.success.main, 0.1),
                                  color: theme.palette.success.main,
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="View Details">
                                <IconButton size="small" onClick={() => setSelectedTransfer(transfer)}>
                                  <InfoIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredTransfers.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={PAGINATION.ROWS_PER_PAGE_OPTIONS}
                />
              </>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Transfer Detail Dialog */}
      <Dialog open={!!selectedTransfer} onClose={() => setSelectedTransfer(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Transfer Details
            <IconButton onClick={() => setSelectedTransfer(null)} aria-label="Close dialog">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTransfer && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Transfer ID
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  #{selectedTransfer.id}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Product
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedTransfer.product?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTransfer.product?.sku}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    From
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedTransfer.fromWarehouse?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedTransfer.fromWarehouse?.location}
                  </Typography>
                </Box>
                <ArrowIcon color="primary" sx={{ fontSize: 32 }} />
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    To
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedTransfer.toWarehouse?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedTransfer.toWarehouse?.location}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Quantity
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    {formatNumber(selectedTransfer.quantity)} units
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Value
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {formatCurrency(selectedTransfer.quantity * (selectedTransfer.product?.unitCost || 0))}
                  </Typography>
                </Box>
              </Box>
              {selectedTransfer.notes && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body2">{selectedTransfer.notes}</Typography>
                  </Box>
                </>
              )}
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Transfer Date
                </Typography>
                <Typography variant="body1">{formatDate(selectedTransfer.createdAt)}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTransfer(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
