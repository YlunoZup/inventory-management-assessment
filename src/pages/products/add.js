import { useState } from 'react';
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

const CATEGORIES = ['Utensils', 'Packaging', 'Cups', 'Bags', 'Containers', 'Other'];

export default function AddProduct() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [product, setProduct] = useState({
    sku: '',
    name: '',
    category: '',
    unitCost: '',
    reorderPoint: '',
  });

  const validate = () => {
    const newErrors = {};
    if (!product.sku.trim()) newErrors.sku = 'SKU is required';
    if (!product.name.trim()) newErrors.name = 'Product name is required';
    if (!product.category) newErrors.category = 'Category is required';
    if (!product.unitCost || parseFloat(product.unitCost) <= 0) {
      newErrors.unitCost = 'Valid unit cost is required';
    }
    if (!product.reorderPoint || parseInt(product.reorderPoint) < 0) {
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
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          unitCost: parseFloat(product.unitCost),
          reorderPoint: parseInt(product.reorderPoint),
        }),
      });

      if (res.ok) {
        enqueueSnackbar('Product added successfully!', { variant: 'success' });
        router.push('/products');
      } else {
        throw new Error('Failed to add product');
      }
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Add Product">
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
            title="Add New Product"
            subheader="Enter the product details below"
          />
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="SKU"
                    name="sku"
                    value={product.sku}
                    onChange={handleChange}
                    error={!!errors.sku}
                    helperText={errors.sku || 'Unique product identifier'}
                    disabled={submitting}
                    placeholder="ECO-XXX-001"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    name="category"
                    value={product.category}
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
                    value={product.name}
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
                    value={product.unitCost}
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
                    value={product.reorderPoint}
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
                      {submitting ? 'Adding...' : 'Add Product'}
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
