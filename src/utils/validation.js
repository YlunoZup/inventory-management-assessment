import { VALIDATION_LIMITS } from '@/constants';

/**
 * Validation utility functions for consistent data validation across the application
 */

/**
 * Validate a string field
 */
export function validateString(value, fieldName, { min = 1, max = 100, required = true } = {}) {
  const errors = [];

  if (required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  if (value !== undefined && value !== null && value !== '') {
    if (typeof value !== 'string') {
      errors.push(`${fieldName} must be a string`);
      return errors;
    }

    const trimmed = value.trim();
    if (trimmed.length < min) {
      errors.push(`${fieldName} must be at least ${min} character(s)`);
    }
    if (trimmed.length > max) {
      errors.push(`${fieldName} must be at most ${max} characters`);
    }
  }

  return errors;
}

/**
 * Validate a number field
 */
export function validateNumber(value, fieldName, { min = 0, max = Infinity, required = true, integer = false } = {}) {
  const errors = [];

  if (required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  if (value !== undefined && value !== null && value !== '') {
    const num = Number(value);

    if (isNaN(num)) {
      errors.push(`${fieldName} must be a valid number`);
      return errors;
    }

    if (integer && !Number.isInteger(num)) {
      errors.push(`${fieldName} must be a whole number`);
    }

    if (num < min) {
      errors.push(`${fieldName} must be at least ${min}`);
    }

    if (num > max) {
      errors.push(`${fieldName} must be at most ${max}`);
    }
  }

  return errors;
}

/**
 * Validate a product object
 */
export function validateProduct(data, isUpdate = false) {
  const errors = [];
  const { SKU, NAME, CATEGORY, UNIT_COST, REORDER_POINT } = VALIDATION_LIMITS;

  // SKU validation
  if (!isUpdate || data.sku !== undefined) {
    errors.push(...validateString(data.sku, 'SKU', {
      min: SKU.min,
      max: SKU.max,
      required: !isUpdate,
    }));
  }

  // Name validation
  if (!isUpdate || data.name !== undefined) {
    errors.push(...validateString(data.name, 'Name', {
      min: NAME.min,
      max: NAME.max,
      required: !isUpdate,
    }));
  }

  // Category validation
  if (!isUpdate || data.category !== undefined) {
    errors.push(...validateString(data.category, 'Category', {
      min: CATEGORY.min,
      max: CATEGORY.max,
      required: !isUpdate,
    }));
  }

  // Unit cost validation
  if (!isUpdate || data.unitCost !== undefined) {
    errors.push(...validateNumber(data.unitCost, 'Unit cost', {
      min: UNIT_COST.min,
      max: UNIT_COST.max,
      required: !isUpdate,
    }));
  }

  // Reorder point validation
  if (!isUpdate || data.reorderPoint !== undefined) {
    errors.push(...validateNumber(data.reorderPoint, 'Reorder point', {
      min: REORDER_POINT.min,
      max: REORDER_POINT.max,
      required: !isUpdate,
      integer: true,
    }));
  }

  return errors;
}

/**
 * Validate a warehouse object
 */
export function validateWarehouse(data, isUpdate = false) {
  const errors = [];
  const { CODE, NAME, LOCATION } = VALIDATION_LIMITS;

  // Code validation
  if (!isUpdate || data.code !== undefined) {
    errors.push(...validateString(data.code, 'Code', {
      min: CODE.min,
      max: CODE.max,
      required: !isUpdate,
    }));
  }

  // Name validation
  if (!isUpdate || data.name !== undefined) {
    errors.push(...validateString(data.name, 'Name', {
      min: NAME.min,
      max: NAME.max,
      required: !isUpdate,
    }));
  }

  // Location validation
  if (!isUpdate || data.location !== undefined) {
    errors.push(...validateString(data.location, 'Location', {
      min: LOCATION.min,
      max: LOCATION.max,
      required: !isUpdate,
    }));
  }

  return errors;
}

/**
 * Validate a stock object
 */
export function validateStock(data, products = [], warehouses = [], isUpdate = false) {
  const errors = [];
  const { QUANTITY } = VALIDATION_LIMITS;

  // Product ID validation
  if (!isUpdate || data.productId !== undefined) {
    if (!isUpdate && (data.productId === undefined || data.productId === null)) {
      errors.push('Product ID is required');
    } else if (data.productId !== undefined && data.productId !== null) {
      const productId = parseInt(data.productId, 10);
      if (isNaN(productId)) {
        errors.push('Product ID must be a valid number');
      } else if (products.length > 0 && !products.find((p) => p.id === productId)) {
        errors.push('Product not found');
      }
    }
  }

  // Warehouse ID validation
  if (!isUpdate || data.warehouseId !== undefined) {
    if (!isUpdate && (data.warehouseId === undefined || data.warehouseId === null)) {
      errors.push('Warehouse ID is required');
    } else if (data.warehouseId !== undefined && data.warehouseId !== null) {
      const warehouseId = parseInt(data.warehouseId, 10);
      if (isNaN(warehouseId)) {
        errors.push('Warehouse ID must be a valid number');
      } else if (warehouses.length > 0 && !warehouses.find((w) => w.id === warehouseId)) {
        errors.push('Warehouse not found');
      }
    }
  }

  // Quantity validation
  if (!isUpdate || data.quantity !== undefined) {
    errors.push(...validateNumber(data.quantity, 'Quantity', {
      min: QUANTITY.min,
      max: QUANTITY.max,
      required: !isUpdate,
      integer: true,
    }));
  }

  return errors;
}

/**
 * Validate a transfer object
 */
export function validateTransfer(data, availableStock = null) {
  const errors = [];
  const { QUANTITY, NOTES } = VALIDATION_LIMITS;

  // Product ID validation
  if (data.productId === undefined || data.productId === null) {
    errors.push('Product ID is required');
  } else {
    const productId = parseInt(data.productId, 10);
    if (isNaN(productId)) {
      errors.push('Product ID must be a valid number');
    }
  }

  // Source warehouse validation
  if (data.fromWarehouseId === undefined || data.fromWarehouseId === null) {
    errors.push('Source warehouse ID is required');
  } else {
    const fromId = parseInt(data.fromWarehouseId, 10);
    if (isNaN(fromId)) {
      errors.push('Source warehouse ID must be a valid number');
    }
  }

  // Destination warehouse validation
  if (data.toWarehouseId === undefined || data.toWarehouseId === null) {
    errors.push('Destination warehouse ID is required');
  } else {
    const toId = parseInt(data.toWarehouseId, 10);
    if (isNaN(toId)) {
      errors.push('Destination warehouse ID must be a valid number');
    }
  }

  // Same warehouse check
  if (data.fromWarehouseId && data.toWarehouseId) {
    const fromId = parseInt(data.fromWarehouseId, 10);
    const toId = parseInt(data.toWarehouseId, 10);
    if (fromId === toId) {
      errors.push('Source and destination warehouses must be different');
    }
  }

  // Quantity validation
  const quantityErrors = validateNumber(data.quantity, 'Quantity', {
    min: 1,
    max: QUANTITY.max,
    required: true,
    integer: true,
  });
  errors.push(...quantityErrors);

  // Check available stock if provided
  if (availableStock !== null && quantityErrors.length === 0) {
    const qty = parseInt(data.quantity, 10);
    if (qty > availableStock) {
      errors.push(`Insufficient stock. Only ${availableStock} units available`);
    }
  }

  // Notes validation (optional)
  if (data.notes !== undefined && data.notes !== null && data.notes !== '') {
    errors.push(...validateString(data.notes, 'Notes', {
      min: 0,
      max: NOTES.max,
      required: false,
    }));
  }

  return errors;
}

/**
 * Sanitize a string value
 */
export function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

/**
 * Sanitize a number value
 */
export function sanitizeNumber(value, defaultValue = 0) {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Sanitize an integer value
 */
export function sanitizeInteger(value, defaultValue = 0) {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

export default {
  validateString,
  validateNumber,
  validateProduct,
  validateWarehouse,
  validateStock,
  validateTransfer,
  sanitizeString,
  sanitizeNumber,
  sanitizeInteger,
};
