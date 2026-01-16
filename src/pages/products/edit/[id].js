import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorDisplay from '@/components/ErrorDisplay';

const CATEGORIES = ['Utensils', 'Packaging', 'Cups', 'Bags', 'Containers', 'Other'];

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [product, setProduct] = useState({
    sku: '',
    name: '',
    category: '',
    unitCost: '',
    reorderPoint: '',
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error('Failed to fetch product');
      const data = await res.json();
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!product.sku?.trim()) newErrors.sku = 'SKU is required';
    if (!product.name?.trim()) newErrors.name = 'Product name is required';
    if (!product.category) newErrors.category = 'Category is required';
    if (!product.unitCost || parseFloat(product.unitCost) <= 0) {
      newErrors.unitCost = 'Valid unit cost is required';
    }
    if (product.reorderPoint === undefined || parseInt(product.reorderPoint) < 0) {
      newErrors.reorderPoint = 'Valid reorder point is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          unitCost: parseFloat(product.unitCost),
          reorderPoint: parseInt(product.reorderPoint),
        }),
      });

      if (res.ok) {
        enqueueSnackbar('Product updated successfully!', { variant: 'success' });
        router.push('/products');
      } else {
        throw new Error('Failed to update product');
      }
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Edit Product">
        <LoadingScreen message="Loading product..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Edit Product">
        <ErrorDisplay title="Failed to load product" message={error} onRetry={fetchProduct} />
      </Layout>
    );
  }

  return (
    <Layout title="Edit Product">
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Button
          startIcon={<BackIcon />}
          component={Link}
          href="/products"
          sx={{ mb: 2 }}
        >
          Back to Products
        </Button>

        <Card>
          <CardHeader
            title="Edit Product"
            subheader={`Editing ${product.name}`}
          />
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="SKU"
                    name="sku"
                    value={product.sku || ''}
                    onChange={handleChange}
                    error={!!errors.sku}
                    helperText={errors.sku || 'Unique product identifier'}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    name="category"
                    value={product.category || ''}
                    onChange={handleChange}
                    error={!!errors.category}
                    helperText={errors.category || 'Product category'}
                    disabled={submitting}
                  >
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    name="name"
                    value={product.name || ''}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name || 'Full product name'}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Unit Cost"
                    name="unitCost"
                    type="number"
                    value={product.unitCost || ''}
                    onChange={handleChange}
                    error={!!errors.unitCost}
                    helperText={errors.unitCost || 'Cost per unit'}
                    disabled={submitting}
                    inputProps={{ step: '0.01', min: '0' }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Reorder Point"
                    name="reorderPoint"
                    type="number"
                    value={product.reorderPoint || ''}
                    onChange={handleChange}
                    error={!!errors.reorderPoint}
                    helperText={errors.reorderPoint || 'Minimum stock level before reorder'}
                    disabled={submitting}
                    inputProps={{ min: '0' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      component={Link}
                      href="/products"
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
