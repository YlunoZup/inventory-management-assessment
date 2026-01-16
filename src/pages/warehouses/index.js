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
  Grid,
  Collapse,
  TextField,
  InputAdornment,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Warehouse as WarehouseIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as ViewIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorDisplay from '@/components/ErrorDisplay';
import EmptyState from '@/components/EmptyState';
import StatCard from '@/components/StatCard';
import { formatCurrency, formatNumber, generateCSV, downloadCSV } from '@/utils/helpers';

export default function Warehouses() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [warehouses, setWarehouses] = useState([]);
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting states
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Detail dialog
  const [detailWarehouse, setDetailWarehouse] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [warehousesRes, stockRes, productsRes] = await Promise.all([
        fetch('/api/warehouses'),
        fetch('/api/stock'),
        fetch('/api/products'),
      ]);
      if (!warehousesRes.ok) throw new Error('Failed to fetch warehouses');
      const [warehousesData, stockData, productsData] = await Promise.all([
        warehousesRes.json(),
        stockRes.ok ? stockRes.json() : [],
        productsRes.ok ? productsRes.json() : [],
      ]);
      setWarehouses(warehousesData);
      setStock(stockData);
      setProducts(productsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Enrich warehouses with stock data
  const enrichedWarehouses = useMemo(() => {
    return warehouses.map((warehouse) => {
      const warehouseStock = stock.filter((s) => s.warehouseId === warehouse.id);
      const totalUnits = warehouseStock.reduce((sum, s) => sum + s.quantity, 0);
      const totalValue = warehouseStock.reduce((sum, s) => {
        const product = products.find((p) => p.id === s.productId);
        return sum + (product ? product.unitCost * s.quantity : 0);
      }, 0);
      const productCount = warehouseStock.length;
      const utilizationRate = productCount > 0 ? Math.min((productCount / products.length) * 100, 100) : 0;

      return {
        ...warehouse,
        totalUnits,
        totalValue,
        productCount,
        utilizationRate,
      };
    });
  }, [warehouses, stock, products]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalWarehouses = enrichedWarehouses.length;
    const totalValue = enrichedWarehouses.reduce((sum, w) => sum + w.totalValue, 0);
    const totalUnits = enrichedWarehouses.reduce((sum, w) => sum + w.totalUnits, 0);
    const avgUtilization = totalWarehouses > 0
      ? enrichedWarehouses.reduce((sum, w) => sum + w.utilizationRate, 0) / totalWarehouses
      : 0;

    return { totalWarehouses, totalValue, totalUnits, avgUtilization };
  }, [enrichedWarehouses]);

  // Filter warehouses
  const filteredWarehouses = useMemo(() => {
    return enrichedWarehouses.filter((w) => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!w.name.toLowerCase().includes(search) &&
            !w.code.toLowerCase().includes(search) &&
            !w.location.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    });
  }, [enrichedWarehouses, searchTerm]);

  // Sort warehouses
  const sortedWarehouses = useMemo(() => {
    const comparator = (a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case 'code':
          aValue = a.code;
          bValue = b.code;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'location':
          aValue = a.location;
          bValue = b.location;
          break;
        case 'totalUnits':
          aValue = a.totalUnits;
          bValue = b.totalUnits;
          break;
        case 'totalValue':
          aValue = a.totalValue;
          bValue = b.totalValue;
          break;
        case 'productCount':
          aValue = a.productCount;
          bValue = b.productCount;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    };

    return [...filteredWarehouses].sort(comparator);
  }, [filteredWarehouses, orderBy, order]);

  // Paginate
  const paginatedWarehouses = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedWarehouses.slice(start, start + rowsPerPage);
  }, [sortedWarehouses, page, rowsPerPage]);

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
    setSearchTerm('');
    setPage(0);
  };

  const hasActiveFilters = searchTerm;

  const handleClickOpen = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedWarehouse(null);
  };

  const handleViewDetails = (warehouse) => {
    setDetailWarehouse(warehouse);
    setDetailOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedWarehouse) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/warehouses/${selectedWarehouse.id}?cascade=true`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setWarehouses(warehouses.filter((w) => w.id !== selectedWarehouse.id));
        setStock(stock.filter((s) => s.warehouseId !== selectedWarehouse.id));
        enqueueSnackbar('Warehouse deleted successfully', { variant: 'success' });
        handleClose();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete warehouse');
      }
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const columns = [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'location', label: 'Location' },
      { key: 'productCount', label: 'Products' },
      { key: 'totalUnits', label: 'Total Units' },
      { label: 'Total Value', getValue: (row) => formatCurrency(row.totalValue) },
      { label: 'Utilization', getValue: (row) => `${row.utilizationRate.toFixed(0)}%` },
    ];
    const csv = generateCSV(sortedWarehouses, columns);
    downloadCSV(csv, 'warehouses');
    enqueueSnackbar(`Exported ${sortedWarehouses.length} warehouses`, { variant: 'success' });
  };

  const getUtilizationColor = (rate) => {
    if (rate < 25) return 'error';
    if (rate < 50) return 'warning';
    if (rate < 75) return 'info';
    return 'success';
  };

  if (loading) {
    return (
      <Layout title="Warehouses">
        <LoadingScreen message="Loading warehouses..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Warehouses">
        <ErrorDisplay title="Failed to load warehouses" message={error} onRetry={fetchData} />
      </Layout>
    );
  }

  return (
    <Layout title="Warehouses">
      {/* Summary Statistics */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Warehouses"
            value={summaryStats.totalWarehouses}
            icon={WarehouseIcon}
            color="primary"
            subtitle="Active locations"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Units"
            value={formatNumber(summaryStats.totalUnits)}
            icon={InventoryIcon}
            color="info"
            subtitle="Items stored"
          />
        </Grid>
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
            title="Avg. Utilization"
            value={`${summaryStats.avgUtilization.toFixed(0)}%`}
            icon={MapIcon}
            color="secondary"
            subtitle="Product coverage"
          />
        </Grid>
      </Grid>

      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarehouseIcon color="primary" />
              <span>Warehouse Locations</span>
            </Box>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              Showing {paginatedWarehouses.length} of {filteredWarehouses.length} warehouses
              {hasActiveFilters && ` (filtered from ${enrichedWarehouses.length} total)`}
            </Typography>
          }
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title="Refresh data">
                <IconButton onClick={fetchData} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={showFilters ? 'Hide filters' : 'Show filters'}>
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  color={hasActiveFilters ? 'primary' : 'default'}
                >
                  {showFilters ? <ExpandLessIcon /> : <FilterIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Export to CSV">
                <IconButton onClick={handleExport} disabled={filteredWarehouses.length === 0}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={Link}
                href="/warehouses/add"
              >
                Add Warehouse
              </Button>
            </Box>
          }
        />

        {/* Collapsible Filter Section */}
        <Collapse in={showFilters}>
          <CardContent sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02), borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by name, code, or location..."
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
                  aria-label="Search warehouses"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
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
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>

        {filteredWarehouses.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <EmptyState
              icon={WarehouseIcon}
              title={warehouses.length === 0 ? 'No warehouses yet' : 'No results found'}
              message={
                warehouses.length === 0
                  ? 'Get started by adding your first warehouse location.'
                  : 'Try adjusting your search term.'
              }
              actionLabel={warehouses.length === 0 ? 'Add Warehouse' : hasActiveFilters ? 'Clear Filters' : undefined}
              onAction={warehouses.length === 0 ? () => (window.location.href = '/warehouses/add') : hasActiveFilters ? clearFilters : undefined}
            />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table aria-label="Warehouses table">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'code'}
                        direction={orderBy === 'code' ? order : 'asc'}
                        onClick={() => handleSort('code')}
                      >
                        Code
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'name'}
                        direction={orderBy === 'name' ? order : 'asc'}
                        onClick={() => handleSort('name')}
                      >
                        Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'location'}
                        direction={orderBy === 'location' ? order : 'asc'}
                        onClick={() => handleSort('location')}
                      >
                        Location
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'productCount'}
                        direction={orderBy === 'productCount' ? order : 'asc'}
                        onClick={() => handleSort('productCount')}
                      >
                        Products
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'totalUnits'}
                        direction={orderBy === 'totalUnits' ? order : 'asc'}
                        onClick={() => handleSort('totalUnits')}
                      >
                        Units
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'totalValue'}
                        direction={orderBy === 'totalValue' ? order : 'asc'}
                        onClick={() => handleSort('totalValue')}
                      >
                        Value
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedWarehouses.map((warehouse) => (
                    <TableRow
                      key={warehouse.id}
                      sx={{
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={warehouse.code}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontFamily: 'monospace' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {warehouse.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2">{warehouse.location}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500}>
                          {warehouse.productCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          of {products.length}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatNumber(warehouse.totalUnits)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500} color="primary.main">
                          {formatCurrency(warehouse.totalValue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="View details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(warehouse)}
                              aria-label={`View details for ${warehouse.name}`}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit warehouse">
                            <IconButton
                              color="primary"
                              component={Link}
                              href={`/warehouses/edit/${warehouse.id}`}
                              size="small"
                              aria-label={`Edit ${warehouse.name}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete warehouse">
                            <IconButton
                              color="error"
                              onClick={() => handleClickOpen(warehouse)}
                              size="small"
                              aria-label={`Delete ${warehouse.name}`}
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
              count={filteredWarehouses.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              showFirstButton
              showLastButton
              aria-label="Warehouses table pagination"
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
        <DialogTitle id="delete-dialog-title">Delete Warehouse</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete <strong>{selectedWarehouse?.name}</strong>?
            <br /><br />
            {selectedWarehouse?.totalUnits > 0 && (
              <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                This warehouse has {formatNumber(selectedWarehouse.totalUnits)} units in stock
                worth {formatCurrency(selectedWarehouse.totalValue)}.
              </Typography>
            )}
            <Typography variant="body2" color="error">
              This action will also remove all associated stock records and cannot be undone.
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

      {/* Warehouse Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="detail-dialog-title"
      >
        <DialogTitle id="detail-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              <WarehouseIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{detailWarehouse?.name}</Typography>
              <Chip
                label={detailWarehouse?.code}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailWarehouse && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon color="action" />
                  <Typography variant="body1">{detailWarehouse.location}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary">Products Stored</Typography>
                <Typography variant="h5" fontWeight={600}>
                  {detailWarehouse.productCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  of {products.length} total products
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary">Total Units</Typography>
                <Typography variant="h5" fontWeight={600}>
                  {formatNumber(detailWarehouse.totalUnits)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary">Inventory Value</Typography>
                <Typography variant="h5" fontWeight={600} color="primary.main">
                  {formatCurrency(detailWarehouse.totalValue)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary">Utilization Rate</Typography>
                <Typography variant="h5" fontWeight={600} color={getUtilizationColor(detailWarehouse.utilizationRate) + '.main'}>
                  {detailWarehouse.utilizationRate.toFixed(0)}%
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary">Product Coverage</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={detailWarehouse.utilizationRate}
                    color={getUtilizationColor(detailWarehouse.utilizationRate)}
                    sx={{ flex: 1, height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {detailWarehouse.utilizationRate.toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            component={Link}
            href={`/stock?warehouse=${detailWarehouse?.id}`}
          >
            View Stock
          </Button>
          <Button
            component={Link}
            href={`/warehouses/edit/${detailWarehouse?.id}`}
            variant="contained"
          >
            Edit Warehouse
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
