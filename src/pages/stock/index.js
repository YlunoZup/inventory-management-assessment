import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Card,
  CardHeader,
  CardContent,
  Chip,
  Tooltip,
  useTheme,
  alpha,
  TextField,
  MenuItem,
  InputAdornment,
  Grid,
  Paper,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  Fade,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Assessment as StockIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Warehouse as WarehouseIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorDisplay from '@/components/ErrorDisplay';
import EmptyState from '@/components/EmptyState';
import StockStatusChip from '@/components/StockStatusChip';
import StatCard from '@/components/StatCard';
import { formatNumber, formatCurrency, generateCSV, downloadCSV, getStockStatus } from '@/utils/helpers';

export default function Stock() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filter states
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting states
  const [orderBy, setOrderBy] = useState('product');
  const [order, setOrder] = useState('asc');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stockRes, productsRes, warehousesRes] = await Promise.all([
        fetch('/api/stock'),
        fetch('/api/products'),
        fetch('/api/warehouses'),
      ]);

      if (!stockRes.ok || !productsRes.ok || !warehousesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [stockData, productsData, warehousesData] = await Promise.all([
        stockRes.json(),
        productsRes.json(),
        warehousesRes.json(),
      ]);

      setStock(stockData);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getProduct = (productId) => products.find((p) => p.id === productId);
  const getWarehouse = (warehouseId) => warehouses.find((w) => w.id === warehouseId);

  // Enrich stock with product and warehouse data
  const enrichedStock = useMemo(() => {
    return stock.map((item) => {
      const product = getProduct(item.productId);
      const warehouse = getWarehouse(item.warehouseId);
      const stockStatus = product ? getStockStatus(item.quantity, product.reorderPoint) : null;
      return {
        ...item,
        product,
        warehouse,
        value: product ? product.unitCost * item.quantity : 0,
        stockStatus,
      };
    });
  }, [stock, products, warehouses]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalValue = enrichedStock.reduce((sum, item) => sum + item.value, 0);
    const totalUnits = enrichedStock.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockCount = enrichedStock.filter(
      (item) => item.stockStatus && (item.stockStatus.status === 'low' || item.stockStatus.status === 'critical' || item.stockStatus.status === 'out')
    ).length;
    const uniqueProducts = new Set(enrichedStock.map((item) => item.productId)).size;

    return { totalValue, totalUnits, lowStockCount, uniqueProducts };
  }, [enrichedStock]);

  // Filter and search logic
  const filteredStock = useMemo(() => {
    return enrichedStock.filter((item) => {
      // Warehouse filter
      if (filterWarehouse && item.warehouseId !== parseInt(filterWarehouse)) return false;

      // Product filter
      if (filterProduct && item.productId !== parseInt(filterProduct)) return false;

      // Status filter
      if (filterStatus) {
        if (!item.stockStatus) return false;
        if (filterStatus === 'critical' && item.stockStatus.status !== 'critical' && item.stockStatus.status !== 'out') return false;
        if (filterStatus === 'low' && item.stockStatus.status !== 'low') return false;
        if (filterStatus === 'adequate' && item.stockStatus.status !== 'adequate') return false;
        if (filterStatus === 'overstocked' && item.stockStatus.status !== 'overstocked') return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesProduct = item.product?.name?.toLowerCase().includes(search) ||
                              item.product?.sku?.toLowerCase().includes(search);
        const matchesWarehouse = item.warehouse?.name?.toLowerCase().includes(search) ||
                                item.warehouse?.code?.toLowerCase().includes(search);
        if (!matchesProduct && !matchesWarehouse) return false;
      }

      return true;
    });
  }, [enrichedStock, filterWarehouse, filterProduct, filterStatus, searchTerm]);

  // Sorting logic
  const sortedStock = useMemo(() => {
    const comparator = (a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case 'product':
          aValue = a.product?.name || '';
          bValue = b.product?.name || '';
          break;
        case 'warehouse':
          aValue = a.warehouse?.name || '';
          bValue = b.warehouse?.name || '';
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'value':
          aValue = a.value;
          bValue = b.value;
          break;
        case 'status':
          aValue = a.stockStatus?.severity || 0;
          bValue = b.stockStatus?.severity || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    };

    return [...filteredStock].sort(comparator);
  }, [filteredStock, orderBy, order]);

  // Paginated data
  const paginatedStock = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedStock.slice(start, start + rowsPerPage);
  }, [sortedStock, page, rowsPerPage]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setFilterWarehouse('');
    setFilterProduct('');
    setFilterStatus('');
    setSearchTerm('');
    setPage(0);
  };

  const hasActiveFilters = filterWarehouse || filterProduct || filterStatus || searchTerm;

  const handleClickOpen = (item) => {
    setSelectedStock(item);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStock(null);
  };

  const handleDelete = async () => {
    if (!selectedStock) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/stock/${selectedStock.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setStock(stock.filter((s) => s.id !== selectedStock.id));
        enqueueSnackbar('Stock record deleted successfully', { variant: 'success' });
        handleClose();
      } else {
        throw new Error('Failed to delete stock record');
      }
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const columns = [
      { label: 'Product', getValue: (row) => row.product?.name || 'Unknown' },
      { label: 'SKU', getValue: (row) => row.product?.sku || '' },
      { label: 'Category', getValue: (row) => row.product?.category || '' },
      { label: 'Warehouse', getValue: (row) => row.warehouse?.name || 'Unknown' },
      { label: 'Location', getValue: (row) => row.warehouse?.location || '' },
      { label: 'Code', getValue: (row) => row.warehouse?.code || '' },
      { key: 'quantity', label: 'Quantity' },
      { label: 'Reorder Point', getValue: (row) => row.product?.reorderPoint || '' },
      { label: 'Status', getValue: (row) => row.stockStatus?.label || '' },
      { label: 'Unit Cost', getValue: (row) => formatCurrency(row.product?.unitCost || 0) },
      { label: 'Total Value', getValue: (row) => formatCurrency(row.value) },
    ];
    const csv = generateCSV(sortedStock, columns);
    downloadCSV(csv, 'stock_levels');
    enqueueSnackbar(`Exported ${sortedStock.length} stock records`, { variant: 'success' });
  };

  if (loading) {
    return (
      <Layout title="Stock Levels">
        <LoadingScreen message="Loading stock data..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Stock Levels">
        <ErrorDisplay title="Failed to load stock data" message={error} onRetry={fetchData} />
      </Layout>
    );
  }

  return (
    <Layout title="Stock Levels">
      {/* Summary Statistics */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Value"
            value={formatCurrency(summaryStats.totalValue)}
            icon={TrendingUpIcon}
            color="success"
            subtitle="Inventory worth"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Units"
            value={formatNumber(summaryStats.totalUnits)}
            icon={InventoryIcon}
            color="primary"
            subtitle="Items in stock"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Products Tracked"
            value={summaryStats.uniqueProducts}
            icon={StockIcon}
            color="info"
            subtitle="Unique products"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={summaryStats.lowStockCount}
            icon={TrendingDownIcon}
            color={summaryStats.lowStockCount > 0 ? 'error' : 'success'}
            subtitle="Need attention"
          />
        </Grid>
      </Grid>

      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon color="primary" />
              <span>Stock Records</span>
            </Box>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              Showing {paginatedStock.length} of {filteredStock.length} records
              {hasActiveFilters && ` (filtered from ${enrichedStock.length} total)`}
            </Typography>
          }
          action={
            <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Tooltip title="Refresh data">
                <IconButton onClick={fetchData} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={showFilters ? 'Hide filters' : 'Show filters'}>
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  color={hasActiveFilters ? 'primary' : 'default'}
                  size="small"
                >
                  {showFilters ? <ExpandLessIcon /> : <FilterIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Export to CSV">
                <IconButton onClick={handleExport} disabled={filteredStock.length === 0} size="small">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={Link}
                href="/stock/add"
                size="small"
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                Add Stock
              </Button>
              <Tooltip title="Add Stock" sx={{ display: { xs: 'flex', sm: 'none' } }}>
                <IconButton
                  color="primary"
                  component={Link}
                  href="/stock/add"
                  sx={{
                    display: { xs: 'flex', sm: 'none' },
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                  size="small"
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />

        {/* Collapsible Filter Section */}
        <Collapse in={showFilters}>
          <CardContent sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02), borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search products or warehouses..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
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
                  aria-label="Search stock records"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="warehouse-filter-label">Warehouse</InputLabel>
                  <Select
                    labelId="warehouse-filter-label"
                    id="warehouse-filter"
                    value={filterWarehouse}
                    label="Warehouse"
                    onChange={(e) => {
                      setFilterWarehouse(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">
                      <em>All Warehouses</em>
                    </MenuItem>
                    {warehouses.map((w) => (
                      <MenuItem key={w.id} value={w.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarehouseIcon fontSize="small" color="action" />
                          {w.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="product-filter-label">Product</InputLabel>
                  <Select
                    labelId="product-filter-label"
                    id="product-filter"
                    value={filterProduct}
                    label="Product"
                    onChange={(e) => {
                      setFilterProduct(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">
                      <em>All Products</em>
                    </MenuItem>
                    {products.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        <Box>
                          <Typography variant="body2">{p.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.sku}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-filter-label">Stock Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    value={filterStatus}
                    label="Stock Status"
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">
                      <em>All Statuses</em>
                    </MenuItem>
                    <MenuItem value="critical">
                      <Chip label="Critical/Out" size="small" color="error" sx={{ mr: 1 }} />
                    </MenuItem>
                    <MenuItem value="low">
                      <Chip label="Low Stock" size="small" color="warning" sx={{ mr: 1 }} />
                    </MenuItem>
                    <MenuItem value="adequate">
                      <Chip label="Adequate" size="small" color="success" sx={{ mr: 1 }} />
                    </MenuItem>
                    <MenuItem value="overstocked">
                      <Chip label="Overstocked" size="small" color="info" sx={{ mr: 1 }} />
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {hasActiveFilters && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ClearIcon />}
                      onClick={clearFilters}
                      fullWidth
                    >
                      Clear Filters
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>

        {filteredStock.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <EmptyState
              icon={StockIcon}
              title={stock.length === 0 ? 'No stock records' : 'No results found'}
              message={
                stock.length === 0
                  ? 'Add stock records to track inventory across warehouses.'
                  : 'Try adjusting your search or filters to find what you\'re looking for.'
              }
              actionLabel={stock.length === 0 ? 'Add Stock' : hasActiveFilters ? 'Clear Filters' : undefined}
              onAction={stock.length === 0 ? () => (window.location.href = '/stock/add') : hasActiveFilters ? clearFilters : undefined}
            />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table aria-label="Stock levels table">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'product'}
                        direction={orderBy === 'product' ? order : 'asc'}
                        onClick={() => handleSort('product')}
                      >
                        Product
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'warehouse'}
                        direction={orderBy === 'warehouse' ? order : 'asc'}
                        onClick={() => handleSort('warehouse')}
                      >
                        Warehouse
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'quantity'}
                        direction={orderBy === 'quantity' ? order : 'asc'}
                        onClick={() => handleSort('quantity')}
                      >
                        Quantity
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'status'}
                        direction={orderBy === 'status' ? order : 'asc'}
                        onClick={() => handleSort('status')}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'value'}
                        direction={orderBy === 'value' ? order : 'asc'}
                        onClick={() => handleSort('value')}
                      >
                        Value
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedStock.map((item) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {item.product?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            {item.product?.sku || ''}
                          </Typography>
                          {item.product?.category && (
                            <Chip
                              label={item.product.category}
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{item.warehouse?.name || 'Unknown'}</Typography>
                          <Chip
                            icon={<WarehouseIcon sx={{ fontSize: '0.875rem !important' }} />}
                            label={item.warehouse?.code || ''}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatNumber(item.quantity)}
                        </Typography>
                        {item.product && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            / {formatNumber(item.product.reorderPoint)} min
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.stockStatus && (
                          <StockStatusChip
                            quantity={item.quantity}
                            reorderPoint={item.product?.reorderPoint || 0}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500} color="primary.main">
                          {formatCurrency(item.value)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          @ {formatCurrency(item.product?.unitCost || 0)}/unit
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="Edit stock record">
                            <IconButton
                              color="primary"
                              component={Link}
                              href={`/stock/edit/${item.id}`}
                              size="small"
                              aria-label={`Edit stock for ${item.product?.name}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete stock record">
                            <IconButton
                              color="error"
                              onClick={() => handleClickOpen(item)}
                              size="small"
                              aria-label={`Delete stock for ${item.product?.name}`}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredStock.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              showFirstButton
              showLastButton
              aria-label="Stock table pagination"
            />
          </>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Stock Record</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this stock record for{' '}
            <strong>{selectedStock?.product?.name}</strong> at{' '}
            <strong>{selectedStock?.warehouse?.name}</strong>?
            <br /><br />
            <Typography variant="body2" color="error">
              This action cannot be undone.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
