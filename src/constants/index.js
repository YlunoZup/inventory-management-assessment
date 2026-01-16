// Product categories
export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Food & Beverages',
  'Health & Beauty',
  'Sports & Outdoors',
  'Home & Garden',
  'Automotive',
  'Office Supplies',
  'Other',
];

// Stock status thresholds
export const STOCK_THRESHOLDS = {
  CRITICAL: 0.25, // 25% of reorder point
  LOW: 1.0, // 100% of reorder point
  ADEQUATE: 2.0, // 200% of reorder point
  // Anything above ADEQUATE is considered overstocked
};

// Stock status configurations
export const STOCK_STATUS = {
  OUT: {
    status: 'out',
    label: 'Out of Stock',
    color: 'error',
    severity: 4,
  },
  CRITICAL: {
    status: 'critical',
    label: 'Critical',
    color: 'error',
    severity: 3,
  },
  LOW: {
    status: 'low',
    label: 'Low Stock',
    color: 'warning',
    severity: 2,
  },
  ADEQUATE: {
    status: 'adequate',
    label: 'Adequate',
    color: 'success',
    severity: 1,
  },
  OVERSTOCKED: {
    status: 'overstocked',
    label: 'Overstocked',
    color: 'info',
    severity: 0,
  },
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_ROWS_PER_PAGE: 10,
  ROWS_PER_PAGE_OPTIONS: [5, 10, 25, 50],
};

// API response messages
export const API_MESSAGES = {
  // Success messages
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  STOCK_CREATED: 'Stock record created successfully',
  STOCK_UPDATED: 'Stock record updated successfully',
  STOCK_DELETED: 'Stock record deleted successfully',
  WAREHOUSE_CREATED: 'Warehouse created successfully',
  WAREHOUSE_UPDATED: 'Warehouse updated successfully',
  WAREHOUSE_DELETED: 'Warehouse deleted successfully',
  TRANSFER_COMPLETED: 'Transfer completed successfully',

  // Error messages
  VALIDATION_FAILED: 'Validation failed',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource conflict',
  INTERNAL_ERROR: 'An unexpected error occurred',
  METHOD_NOT_ALLOWED: 'Method not allowed',
};

// Field validation limits
export const VALIDATION_LIMITS = {
  SKU: { min: 1, max: 50 },
  NAME: { min: 1, max: 100 },
  CATEGORY: { min: 1, max: 50 },
  LOCATION: { min: 1, max: 200 },
  CODE: { min: 1, max: 20 },
  NOTES: { min: 0, max: 500 },
  QUANTITY: { min: 0, max: 999999 },
  UNIT_COST: { min: 0, max: 9999999.99 },
  REORDER_POINT: { min: 0, max: 999999 },
};

// Export formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM d, yyyy',
  DISPLAY_WITH_TIME: 'MMM d, yyyy h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
};

// Chart colors
export const CHART_COLORS = {
  PRIMARY: '#2e7d32',
  SECONDARY: '#6c757d',
  SUCCESS: '#4caf50',
  WARNING: '#ff9800',
  ERROR: '#f44336',
  INFO: '#2196f3',
};

export default {
  PRODUCT_CATEGORIES,
  STOCK_THRESHOLDS,
  STOCK_STATUS,
  PAGINATION,
  API_MESSAGES,
  VALIDATION_LIMITS,
  EXPORT_FORMATS,
  DATE_FORMATS,
  CHART_COLORS,
};
