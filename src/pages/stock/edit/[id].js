import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  MenuItem,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorDisplay from '@/components/ErrorDisplay';

export default function EditStock() {
  const router = useRouter();
  const { id } = router.query;
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [errors, setErrors] = useState({});
  const [stockRecord, setStockRecord] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stockRes, productsRes, warehousesRes] = await Promise.all([
        fetch(`/api/stock/${id}`),
        fetch('/api/products'),
        fetch('/api/warehouses'),
      ]);

      if (!stockRes.ok) throw new Error('Failed to fetch stock record');

      const [stockData, productsData, warehousesData] = await Promise.all([
        stockRes.json(),
        productsRes.json(),
        warehousesRes.json(),
      ]);

      setStockRecord(stockData);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!stockRecord.productId) newErrors.productId = 'Please select a product';
    if (!stockRecord.warehouseId) newErrors.warehouseId = 'Please select a warehouse';
    if (stockRecord.quantity === '' || parseInt(stockRecord.quantity) < 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStockRecord({ ...stockRecord, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/stock/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: parseInt(stockRecord.productId),
          warehouseId: parseInt(stockRecord.warehouseId),
          quantity: parseInt(stockRecord.quantity),
        }),
      });

      if (res.ok) {
        enqueueSnackbar('Stock record updated successfully!', { variant: 'success' });
        router.push('/stock');
      } else {
        throw new Error('Failed to update stock record');
      }
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Edit Stock">
        <LoadingScreen message="Loading stock record..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Edit Stock">
        <ErrorDisplay title="Failed to load stock record" message={error} onRetry={fetchData} />
      </Layout>
    );
  }

  return (
    <Layout title="Edit Stock">
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Button
          startIcon={<BackIcon />}
          component={Link}
          href="/stock"
          sx={{ mb: 2 }}
        >
          Back to Stock Levels
        </Button>

        <Card>
          <CardHeader
            title="Edit Stock Record"
            subheader="Update inventory quantity"
          />
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Product"
                    name="productId"
                    value={stockRecord.productId || ''}
                    onChange={handleChange}
                    error={!!errors.productId}
                    helperText={errors.productId || 'Select the product'}
                    disabled={submitting}
                  >
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Warehouse"
                    name="warehouseId"
                    value={stockRecord.warehouseId || ''}
                    onChange={handleChange}
                    error={!!errors.warehouseId}
                    helperText={errors.warehouseId || 'Select the warehouse location'}
                    disabled={submitting}
                  >
                    {warehouses.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity"
                    name="quantity"
                    value={stockRecord.quantity || ''}
                    onChange={handleChange}
                    error={!!errors.quantity}
                    helperText={errors.quantity || 'Number of units'}
                    disabled={submitting}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'stretch', sm: 'flex-end' }, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                    <Button
                      variant="outlined"
                      component={Link}
                      href="/stock"
                      disabled={submitting}
                      fullWidth
                      sx={{ width: { sm: 'auto' } }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={submitting}
                      fullWidth
                      sx={{ width: { sm: 'auto' } }}
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
}
