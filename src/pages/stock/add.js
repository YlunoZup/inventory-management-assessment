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

export default function AddStock() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [errors, setErrors] = useState({});
  const [stockRecord, setStockRecord] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/warehouses'),
      ]);
      const [productsData, warehousesData] = await Promise.all([
        productsRes.json(),
        warehousesRes.json(),
      ]);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (err) {
      enqueueSnackbar('Failed to load data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!stockRecord.productId) newErrors.productId = 'Please select a product';
    if (!stockRecord.warehouseId) newErrors.warehouseId = 'Please select a warehouse';
    if (!stockRecord.quantity || parseInt(stockRecord.quantity) < 0) {
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
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: parseInt(stockRecord.productId),
          warehouseId: parseInt(stockRecord.warehouseId),
          quantity: parseInt(stockRecord.quantity),
        }),
      });

      if (res.ok) {
        enqueueSnackbar('Stock record added successfully!', { variant: 'success' });
        router.push('/stock');
      } else {
        throw new Error('Failed to add stock record');
      }
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Add Stock">
        <LoadingScreen message="Loading..." />
      </Layout>
    );
  }

  return (
    <Layout title="Add Stock">
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
            title="Add Stock Record"
            subheader="Add inventory to a warehouse location"
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
                    value={stockRecord.productId}
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
                    value={stockRecord.warehouseId}
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
                    value={stockRecord.quantity}
                    onChange={handleChange}
                    error={!!errors.quantity}
                    helperText={errors.quantity || 'Number of units'}
                    disabled={submitting}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      component={Link}
                      href="/stock"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={submitting}
                    >
                      {submitting ? 'Adding...' : 'Add Stock'}
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
