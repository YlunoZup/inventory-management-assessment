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
  InputAdornment,
  TextField,
  Grid,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Inventory as InventoryIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorDisplay from '@/components/ErrorDisplay';
import EmptyState from '@/components/EmptyState';
import StatCard from '@/components/StatCard';
import { formatCurrency, formatNumber, generateCSV, downloadCSV } from '@/utils/helpers';

export default function Products() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sorting states
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Detail view
  const [detailProduct, setDetailProduct] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, stockRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/stock'),
      ]);
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      const [productsData, stockData] = await Promise.all([
        productsRes.json(),
        stockRes.ok ? stockRes.json() : [],
      ]);
      setProducts(productsData);
      setStock(stockData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(products.map((p) => p.category))].sort();
  }, [products]);

  // Enrich products with stock data
  const enrichedProducts = useMemo(() => {
    return products.map((product) => {
      const productStock = stock.filter((s) => s.productId === product.id);
      const totalQuantity = productStock.reduce((sum, s) => sum + s.quantity, 0);
      const totalValue = totalQuantity * product.unitCost;
      const warehouseCount = productStock.length;

      return {
        ...product,
        totalQuantity,
        totalValue,
        warehouseCount,
        stockPercentage: product.reorderPoint > 0 ? (totalQuantity / product.reorderPoint) * 100 : 0,
      };
    });
  }, [products, stock]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalProducts = enrichedProducts.length;
    const totalCategories = categories.length;
    const totalValue = enrichedProducts.reduce((sum, p) => sum + p.totalValue, 0);
    const avgUnitCost = totalProducts > 0
      ? enrichedProducts.reduce((sum, p) => sum + p.unitCost, 0) / totalProducts
      : 0;

    return { totalProducts, totalCategories, totalValue, avgUnitCost };
  }, [enrichedProducts, categories]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return enrichedProducts.filter((p) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!p.name.toLowerCase().includes(search) &&
            !p.sku.toLowerCase().includes(search) &&
            !p.category.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter && p.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [enrichedProducts, searchTerm, categoryFilter]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const comparator = (a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case 'sku':
          aValue = a.sku;
          bValue = b.sku;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'unitCost':
          aValue = a.unitCost;
          bValue = b.unitCost;
          break;
        case 'reorderPoint':
          aValue = a.reorderPoint;
          bValue = b.reorderPoint;
          break;
        case 'totalQuantity':
          aValue = a.totalQuantity;
          bValue = b.totalQuantity;
          break;
        case 'totalValue':
          aValue = a.totalValue;
          bValue = b.totalValue;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    };

    return [...filteredProducts].sort(comparator);
  }, [filteredProducts, orderBy, order]);

  // Paginate
  const paginatedProducts = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedProducts.slice(start, start + rowsPerPage);
  }, [sortedProducts, page, rowsPerPage]);

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
    setCategoryFilter('');
    setPage(0);
  };

  const hasActiveFilters = searchTerm || categoryFilter;

  const handleClickOpen = (product) => {
    setSelectedProduct(product);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProduct(null);
  };

  const handleViewDetails = (product) => {
    setDetailProduct(product);
    setDetailOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}?cascade=true`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== selectedProduct.id));
        setStock(stock.filter((s) => s.productId !== selectedProduct.id));
        enqueueSnackbar('Product deleted successfully', { variant: 'success' });
        handleClose();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete product');
      }
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const columns = [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { label: 'Unit Cost', getValue: (row) => formatCurrency(row.unitCost) },
      { key: 'reorderPoint', label: 'Reorder Point' },
      { key: 'totalQuantity', label: 'Total Stock' },
      { label: 'Total Value', getValue: (row) => formatCurrency(row.totalValue) },
      { key: 'warehouseCount', label: 'Warehouses' },
    ];
    const csv = generateCSV(sortedProducts, columns);
    downloadCSV(csv, 'products');
    enqueueSnackbar(`Exported ${sortedProducts.length} products`, { variant: 'success' });
  };

  const getStockStatusColor = (percentage) => {
    if (percentage === 0) return 'error';
    if (percentage < 50) return 'error';
    if (percentage < 100) return 'warning';
    if (percentage < 200) return 'success';
    return 'info';
  };

  if (loading) {
    return (
      <Layout title="Products">
        <LoadingScreen message="Loading products..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Products">
        <ErrorDisplay title="Failed to load products" message={error} onRetry={fetchData} />
      </Layout>
    );
  }

  return (
    <Layout title="Products">
      {/* Summary Statistics */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={summaryStats.totalProducts}
            icon={InventoryIcon}
            color="primary"
            subtitle="In catalog"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Categories"
            value={summaryStats.totalCategories}
            icon={CategoryIcon}
            color="secondary"
            subtitle="Product types"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Inventory Value"
            value={formatCurrency(summaryStats.totalValue)}
            icon={TrendingUpIcon}
            color="success"
            subtitle="Total stock value"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Avg. Unit Cost"
            value={formatCurrency(summaryStats.avgUnitCost)}
            icon={MoneyIcon}
            color="info"
            subtitle="Per product"
          />
        </Grid>
      </Grid>

      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon color="primary" />
              <span>Product Catalog</span>
            </Box>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              Showing {paginatedProducts.length} of {filteredProducts.length} products
              {hasActiveFilters && ` (filtered from ${enrichedProducts.length} total)`}
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
                <IconButton onClick={handleExport} disabled={filteredProducts.length === 0}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={Link}
                href="/products/add"
              >
                Add Product
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
                  placeholder="Search by name, SKU, or category..."
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
                  aria-label="Search products"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="category-filter-label">Category</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    id="category-filter"
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(0);
                    }}
                  >
                    <MenuItem value="">
                      <em>All Categories</em>
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CategoryIcon fontSize="small" color="action" />
                          {cat}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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

        {filteredProducts.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <EmptyState
              icon={InventoryIcon}
              title={products.length === 0 ? 'No products yet' : 'No results found'}
              message={
                products.length === 0
                  ? 'Get started by adding your first product to the catalog.'
                  : 'Try adjusting your search or filters.'
              }
              actionLabel={products.length === 0 ? 'Add Product' : hasActiveFilters ? 'Clear Filters' : undefined}
              onAction={products.length === 0 ? () => (window.location.href = '/products/add') : hasActiveFilters ? clearFilters : undefined}
            />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table aria-label="Products table">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'sku'}
                        direction={orderBy === 'sku' ? order : 'asc'}
                        onClick={() => handleSort('sku')}
                      >
                        SKU
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'name'}
                        direction={orderBy === 'name' ? order : 'asc'}
                        onClick={() => handleSort('name')}
                      >
                        Product
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'category'}
                        direction={orderBy === 'category' ? order : 'asc'}
                        onClick={() => handleSort('category')}
                      >
                        Category
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'unitCost'}
                        direction={orderBy === 'unitCost' ? order : 'asc'}
                        onClick={() => handleSort('unitCost')}
                      >
                        Unit Cost
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === 'totalQuantity'}
                        direction={orderBy === 'totalQuantity' ? order : 'asc'}
                        onClick={() => handleSort('totalQuantity')}
                      >
                        Stock Level
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
                  {paginatedProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      sx={{
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                          {product.sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {product.name}
                          </Typography>
                          {product.warehouseCount > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              In {product.warehouseCount} warehouse{product.warehouseCount > 1 ? 's' : ''}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.category}
                          size="small"
                          variant="outlined"
                          icon={<CategoryIcon sx={{ fontSize: '0.875rem !important' }} />}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500}>
                          {formatCurrency(product.unitCost)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ minWidth: 140 }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {formatNumber(product.totalQuantity)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              / {formatNumber(product.reorderPoint)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(product.stockPercentage, 100)}
                            color={getStockStatusColor(product.stockPercentage)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha(theme.palette.grey[500], 0.1),
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={500} color="primary.main">
                          {formatCurrency(product.totalValue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="View details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(product)}
                              aria-label={`View details for ${product.name}`}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit product">
                            <IconButton
                              color="primary"
                              component={Link}
                              href={`/products/edit/${product.id}`}
                              size="small"
                              aria-label={`Edit ${product.name}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete product">
                            <IconButton
                              color="error"
                              onClick={() => handleClickOpen(product)}
                              size="small"
                              aria-label={`Delete ${product.name}`}
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
              count={filteredProducts.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              showFirstButton
              showLastButton
              aria-label="Products table pagination"
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
        <DialogTitle id="delete-dialog-title">Delete Product</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>?
            <br /><br />
            {selectedProduct?.totalQuantity > 0 && (
              <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                This product has {formatNumber(selectedProduct.totalQuantity)} units in stock
                worth {formatCurrency(selectedProduct.totalValue)}.
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

      {/* Product Detail Dialog */}
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
              <InventoryIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{detailProduct?.name}</Typography>
              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                {detailProduct?.sku}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailProduct && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary">Category</Typography>
                <Typography variant="body1">{detailProduct.category}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary">Unit Cost</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatCurrency(detailProduct.unitCost)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary">Reorder Point</Typography>
                <Typography variant="body1">{formatNumber(detailProduct.reorderPoint)} units</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary">Current Stock</Typography>
                <Typography variant="body1" fontWeight={600} color={getStockStatusColor(detailProduct.stockPercentage) + '.main'}>
                  {formatNumber(detailProduct.totalQuantity)} units
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary">Total Value</Typography>
                <Typography variant="body1" fontWeight={600} color="primary.main">
                  {formatCurrency(detailProduct.totalValue)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary">Warehouses</Typography>
                <Typography variant="body1">{detailProduct.warehouseCount} location{detailProduct.warehouseCount !== 1 ? 's' : ''}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="overline" color="text.secondary">Stock Level</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(detailProduct.stockPercentage, 100)}
                    color={getStockStatusColor(detailProduct.stockPercentage)}
                    sx={{ flex: 1, height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" fontWeight={600}>
                    {detailProduct.stockPercentage.toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            component={Link}
            href={`/stock?product=${detailProduct?.id}`}
          >
            View Stock
          </Button>
          <Button
            component={Link}
            href={`/products/edit/${detailProduct?.id}`}
            variant="contained"
          >
            Edit Product
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
