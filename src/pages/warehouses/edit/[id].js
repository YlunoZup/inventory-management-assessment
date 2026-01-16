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
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import Layout from '@/components/Layout';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorDisplay from '@/components/ErrorDisplay';

export default function EditWarehouse() {
  const router = useRouter();
  const { id } = router.query;
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [warehouse, setWarehouse] = useState({
    code: '',
    name: '',
    location: '',
  });

  useEffect(() => {
    if (id) {
      fetchWarehouse();
    }
  }, [id]);

  const fetchWarehouse = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/warehouses/${id}`);
      if (!res.ok) throw new Error('Failed to fetch warehouse');
      const data = await res.json();
      setWarehouse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!warehouse.code?.trim()) newErrors.code = 'Code is required';
    if (!warehouse.name?.trim()) newErrors.name = 'Name is required';
    if (!warehouse.location?.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWarehouse({ ...warehouse, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/warehouses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(warehouse),
      });

      if (res.ok) {
        enqueueSnackbar('Warehouse updated successfully!', { variant: 'success' });
        router.push('/warehouses');
      } else {
        throw new Error('Failed to update warehouse');
      }
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Edit Warehouse">
        <LoadingScreen message="Loading warehouse..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Edit Warehouse">
        <ErrorDisplay title="Failed to load warehouse" message={error} onRetry={fetchWarehouse} />
      </Layout>
    );
  }

  return (
    <Layout title="Edit Warehouse">
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Button
          startIcon={<BackIcon />}
          component={Link}
          href="/warehouses"
          sx={{ mb: 2 }}
        >
          Back to Warehouses
        </Button>

        <Card>
          <CardHeader
            title="Edit Warehouse"
            subheader={`Editing ${warehouse.name}`}
          />
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Warehouse Code"
                    name="code"
                    value={warehouse.code || ''}
                    onChange={handleChange}
                    error={!!errors.code}
                    helperText={errors.code || 'e.g., WH-01'}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Warehouse Name"
                    name="name"
                    value={warehouse.name || ''}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name || 'Full warehouse name'}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={warehouse.location || ''}
                    onChange={handleChange}
                    error={!!errors.location}
                    helperText={errors.location || 'City, State'}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      component={Link}
                      href="/warehouses"
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
