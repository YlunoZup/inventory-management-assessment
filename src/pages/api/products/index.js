// pages/api/products/index.js
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'products.json');

// Helper to read products safely
const readProducts = () => {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading products file:', error.message);
    return [];
  }
};

// Helper to write products safely
const writeProducts = (products) => {
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
};

// Validate product input
const validateProduct = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate) {
    if (!data.sku || typeof data.sku !== 'string' || data.sku.trim().length === 0) {
      errors.push('SKU is required and must be a non-empty string');
    }
  }

  if (data.sku !== undefined && (typeof data.sku !== 'string' || data.sku.trim().length > 50)) {
    errors.push('SKU must be a string with max 50 characters');
  }

  if (!isUpdate) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }
  }

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length > 100)) {
    errors.push('Name must be a string with max 100 characters');
  }

  if (!isUpdate) {
    if (!data.category || typeof data.category !== 'string') {
      errors.push('Category is required');
    }
  }

  if (data.unitCost !== undefined) {
    const cost = parseFloat(data.unitCost);
    if (isNaN(cost) || cost < 0) {
      errors.push('Unit cost must be a non-negative number');
    }
  } else if (!isUpdate) {
    errors.push('Unit cost is required');
  }

  if (data.reorderPoint !== undefined) {
    const point = parseInt(data.reorderPoint, 10);
    if (isNaN(point) || point < 0) {
      errors.push('Reorder point must be a non-negative integer');
    }
  } else if (!isUpdate) {
    errors.push('Reorder point is required');
  }

  return errors;
};

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const products = readProducts();
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      const products = readProducts();
      const validationErrors = validateProduct(req.body);

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors,
        });
      }

      // Check for duplicate SKU
      const existingSku = products.find(
        (p) => p.sku.toLowerCase() === req.body.sku.trim().toLowerCase()
      );
      if (existingSku) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'A product with this SKU already exists',
        });
      }

      const newProduct = {
        id: products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1,
        sku: req.body.sku.trim(),
        name: req.body.name.trim(),
        category: req.body.category.trim(),
        unitCost: parseFloat(req.body.unitCost),
        reorderPoint: parseInt(req.body.reorderPoint, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      products.push(newProduct);
      writeProducts(products);

      return res.status(201).json(newProduct);
    }

    // Method not allowed
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Products API Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request',
    });
  }
}
