import { useState, useEffect } from 'react';
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
  Paper,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Warehouse as WarehouseIcon,
  Category as CategoryIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  SwapHoriz as TransferIcon,
  Add as AddIcon,
  ArrowForward as ArrowIcon,
  Download as DownloadIcon,
  LocalShipping as ShippingIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import StockStatusChip from '@/components/StockStatusChip';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorDisplay from '@/components/ErrorDisplay';
import ActivityFeed from '@/components/ActivityFeed';
import { formatCurrency, formatNumber, getStockStatus, downloadCSV, generateCSV } from '@/utils/helpers';

export default function Dashboard() {
  const theme = useTheme();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stock, setStock] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, warehousesRes, stockRes, transfersRes, alertsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/warehouses'),
        fetch('/api/stock'),
        fetch('/api/transfers').catch(() => ({ ok: true, json: () => [] })),
        fetch('/api/alerts').catch(() => ({ ok: true, json: () => [] })),
      ]);

      if (!productsRes.ok || !warehousesRes.ok || !stockRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [productsData, warehousesData, stockData, transfersData, alertsData] = await Promise.all([
        productsRes.json(),
        warehousesRes.json(),
        stockRes.json(),
        transfersRes.json ? transfersRes.json() : [],
        alertsRes.json ? alertsRes.json() : [],
      ]);

      setProducts(productsData);
      setWarehouses(warehousesData);
      setStock(stockData);
      setTransfers(Array.isArray(transfersData) ? transfersData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate metrics
  const totalValue = stock.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? product.unitCost * item.quantity : 0);
  }, 0);

  const totalUnits = stock.reduce((sum, item) => sum + item.quantity, 0);

  // Get inventory overview with stock status
  const inventoryOverview = products.map((product) => {
    const productStock = stock.filter((s) => s.productId === product.id);
    const totalQuantity = productStock.reduce((sum, s) => sum + s.quantity, 0);
    const stockStatus = getStockStatus(totalQuantity, product.reorderPoint);
    const value = totalQuantity * product.unitCost;

    return {
      ...product,
      totalQuantity,
      stockStatus,
      value,
      warehouseBreakdown: productStock.map((s) => ({
        warehouse: warehouses.find((w) => w.id === s.warehouseId),
        quantity: s.quantity,
      })),
    };
  });

  // Count products by status
  const statusCounts = {
    critical: inventoryOverview.filter((p) => p.stockStatus.status === 'critical' || p.stockStatus.status === 'out').length,
    low: inventoryOverview.filter((p) => p.stockStatus.status === 'low').length,
    adequate: inventoryOverview.filter((p) => p.stockStatus.status === 'adequate').length,
    overstocked: inventoryOverview.filter((p) => p.stockStatus.status === 'overstocked').length,
  };

  // Category distribution data for pie chart
  const categoryData = products.reduce((acc, product) => {
    const existing = acc.find((c) => c.name === product.category);
    const productStock = stock
      .filter((s) => s.productId === product.id)
      .reduce((sum, s) => sum + s.quantity, 0);
    const value = productStock * product.unitCost;

    if (existing) {
      existing.value += value;
      existing.units += productStock;
    } else {
      acc.push({ name: product.category, value, units: productStock });
    }
    return acc;
  }, []);

  // Warehouse stock data for bar chart
  const warehouseData = warehouses.map((warehouse) => {
    const warehouseStock = stock.filter((s) => s.warehouseId === warehouse.id);
    const totalUnits = warehouseStock.reduce((sum, s) => sum + s.quantity, 0);
    const totalValue = warehouseStock.reduce((sum, s) => {
      const product = products.find((p) => p.id === s.productId);
      return sum + (product ? product.unitCost * s.quantity : 0);
    }, 0);

    return {
      name: warehouse.code,
      fullName: warehouse.name,
      units: totalUnits,
      value: totalValue,
    };
  });

  // Colors for charts - extended palette for more categories
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.error.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7c43',
    '#665191',
    '#a05195',
    '#d45087',
    '#f95d6a',
    '#ff7c43',
  ];

  // Export inventory data
  const handleExport = () => {
    const columns = [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Product Name' },
      { key: 'category', label: 'Category' },
      { key: 'totalQuantity', label: 'Total Stock' },
      { key: 'reorderPoint', label: 'Reorder Point' },
      { label: 'Status', getValue: (row) => row.stockStatus.label },
      { label: 'Value', getValue: (row) => formatCurrency(row.value) },
    ];
    const csv = generateCSV(inventoryOverview, columns);
    downloadCSV(csv, 'inventory_overview');
  };

  // Low stock items for quick view
  const lowStockItems = inventoryOverview
    .filter((p) => p.stockStatus.severity >= 2)
    .sort((a, b) => b.stockStatus.severity - a.stockStatus.severity)
    .slice(0, 5);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <LoadingScreen message="Loading dashboard data..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard">
        <ErrorDisplay
          title="Failed to load dashboard"
          message={error}
          onRetry={fetchData}
        />
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      {/* Quick Stats */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={products.length}
            icon={CategoryIcon}
            color="primary"
            subtitle={`${statusCounts.critical + statusCounts.low} need attention`}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Warehouses"
            value={warehouses.length}
            icon={WarehouseIcon}
            color="secondary"
            subtitle="Active locations"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Total Units"
            value={formatNumber(totalUnits)}
            icon={InventoryIcon}
            color="info"
            subtitle="Across all warehouses"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            title="Inventory Value"
            value={formatCurrency(totalValue)}
            icon={MoneyIcon}
            color="success"
            subtitle="Total stock value"
          />
        </Grid>
      </Grid>

      {/* Stock Status Overview */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.08), border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
            <CardContent sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 }, px: { xs: 1, sm: 2 } }}>
              <Typography variant="h4" fontWeight={700} color="error.main" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                {statusCounts.critical}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Critical/Out
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.08), border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
            <CardContent sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 }, px: { xs: 1, sm: 2 } }}>
              <Typography variant="h4" fontWeight={700} color="warning.main" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                {statusCounts.low}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Low Stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.08), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
            <CardContent sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 }, px: { xs: 1, sm: 2 } }}>
              <Typography variant="h4" fontWeight={700} color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                {statusCounts.adequate}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Adequate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.08), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
            <CardContent sx={{ textAlign: 'center', py: { xs: 1.5, sm: 2 }, px: { xs: 1, sm: 2 } }}>
              <Typography variant="h4" fontWeight={700} color="info.main" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                {statusCounts.overstocked}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Overstocked
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        {/* Warehouse Stock Distribution */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Stock by Warehouse"
              subheader="Units and value distribution across locations"
              action={
                <Chip
                  label={`${warehouses.length} Warehouses`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              }
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={warehouseData} margin={{ top: 20, right: 40, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis
                    dataKey="name"
                    stroke={theme.palette.text.secondary}
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke={theme.palette.primary.main}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                    width={50}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke={theme.palette.secondary.main}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value >= 1000 ? `$${(value/1000).toFixed(0)}k` : `$${value}`}
                    width={60}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                    }}
                    formatter={(value, name) => [
                      name === 'units' ? formatNumber(value) : formatCurrency(value),
                      name === 'units' ? 'Units' : 'Value',
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 16 }}
                    iconType="circle"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="units"
                    name="Units"
                    fill={theme.palette.primary.main}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="value"
                    name="Value ($)"
                    fill={theme.palette.secondary.main}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Category Distribution"
              subheader="Inventory value by category"
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                    }}
                    formatter={(value, name) => [formatCurrency(value), name]}
                  />
                  <Legend
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    wrapperStyle={{ paddingTop: 16, fontSize: 12 }}
                    iconType="circle"
                    iconSize={10}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions and Activity Feed */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Quick Actions" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<TransferIcon />}
                  component={Link}
                  href="/transfers"
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  New Stock Transfer
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AddIcon />}
                  component={Link}
                  href="/products/add"
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Add Product
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<WarningIcon />}
                  component={Link}
                  href="/alerts"
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  View Alerts ({statusCounts.critical + statusCounts.low})
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  sx={{ justifyContent: 'flex-start', py: 1.5 }}
                >
                  Export Inventory
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Feed */}
        <Grid item xs={12} md={8}>
          <ActivityFeed maxItems={4} />
        </Grid>
      </Grid>

      {/* Low Stock Alerts */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid item xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Attention Required"
              subheader="Products with low or critical stock levels"
              action={
                <Button
                  size="small"
                  endIcon={<ArrowIcon />}
                  component={Link}
                  href="/alerts"
                >
                  View All
                </Button>
              }
            />
            <CardContent>
              {lowStockItems.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="success.main" fontWeight={500}>
                    All products have adequate stock levels
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {lowStockItems.map((item) => (
                    <Paper
                      key={item.id}
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: alpha(
                          item.stockStatus.status === 'critical' || item.stockStatus.status === 'out'
                            ? theme.palette.error.main
                            : theme.palette.warning.main,
                          0.05
                        ),
                        border: `1px solid ${alpha(
                          item.stockStatus.status === 'critical' || item.stockStatus.status === 'out'
                            ? theme.palette.error.main
                            : theme.palette.warning.main,
                          0.2
                        )}`,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.sku} | {formatNumber(item.totalQuantity)} / {formatNumber(item.reorderPoint)} units
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StockStatusChip quantity={item.totalQuantity} reorderPoint={item.reorderPoint} />
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Inventory Overview Table */}
      <Card>
        <CardHeader
          title="Inventory Overview"
          subheader="Complete stock levels across all products and warehouses"
          action={
            <Tooltip title="Export to CSV">
              <IconButton onClick={handleExport}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Unit Cost</TableCell>
                <TableCell align="right">Total Stock</TableCell>
                <TableCell align="right">Reorder Point</TableCell>
                <TableCell align="right">Stock Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryOverview.map((item) => {
                const stockPercentage = Math.min((item.totalQuantity / item.reorderPoint) * 100, 200);
                const progressColor =
                  item.stockStatus.status === 'critical' || item.stockStatus.status === 'out'
                    ? 'error'
                    : item.stockStatus.status === 'low'
                    ? 'warning'
                    : 'success';

                return (
                  <TableRow
                    key={item.id}
                    sx={{
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                        {item.sku}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {item.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={item.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(item.unitCost)}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600}>{formatNumber(item.totalQuantity)}</Typography>
                    </TableCell>
                    <TableCell align="right">{formatNumber(item.reorderPoint)}</TableCell>
                    <TableCell align="right" sx={{ minWidth: 120 }}>
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
                      <StockStatusChip quantity={item.totalQuantity} reorderPoint={item.reorderPoint} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color="primary.main">
                        {formatCurrency(item.value)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Layout>
  );
}
