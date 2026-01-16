// pages/api/products/[id].js
import fs from 'fs';
import path from 'path';

const productsPath = path.join(process.cwd(), 'data', 'products.json');
const stockPath = path.join(process.cwd(), 'data', 'stock.json');

// Helper to read JSON file safely
const readJsonFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
};

// Helper to write JSON file safely
const writeJsonFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Validate product update input
const validateProductUpdate = (data) => {
  const errors = [];

  if (data.sku !== undefined && (typeof data.sku !== 'string' || data.sku.trim().length === 0 || data.sku.trim().length > 50)) {
    errors.push('SKU must be a non-empty string with max 50 characters');
  }

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length === 0 || data.name.trim().length > 100)) {
    errors.push('Name must be a non-empty string with max 100 characters');
  }

  if (data.category !== undefined && (typeof data.category !== 'string' || data.category.trim().length === 0)) {
    errors.push('Category must be a non-empty string');
  }

  if (data.unitCost !== undefined) {
    const cost = parseFloat(data.unitCost);
    if (isNaN(cost) || cost < 0) {
      errors.push('Unit cost must be a non-negative number');
    }
  }

  if (data.reorderPoint !== undefined) {
    const point = parseInt(data.reorderPoint, 10);
    if (isNaN(point) || point < 0) {
      errors.push('Reorder point must be a non-negative integer');
    }
  }

  return errors;
};

export default function handler(req, res) {
  try {
    const { id, cascade } = req.query;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid product ID',
      });
    }

    const products = readJsonFile(productsPath);

    if (req.method === 'GET') {
      const product = products.find((p) => p.id === parsedId);
      if (product) {
        return res.status(200).json(product);
      }
      return res.status(404).json({
        error: 'Not Found',
        message: 'Product not found',
      });
    }

    if (req.method === 'PUT') {
      const index = products.findIndex((p) => p.id === parsedId);
      if (index === -1) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found',
        });
      }

      const validationErrors = validateProductUpdate(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors,
        });
      }

      // Check for duplicate SKU if being changed
      if (req.body.sku && req.body.sku.trim().toLowerCase() !== products[index].sku.toLowerCase()) {
        const existingSku = products.find(
          (p) => p.sku.toLowerCase() === req.body.sku.trim().toLowerCase() && p.id !== parsedId
        );
        if (existingSku) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'A product with this SKU already exists',
          });
        }
      }

      products[index] = {
        ...products[index],
        ...req.body,
        id: parsedId,
        sku: req.body.sku ? req.body.sku.trim() : products[index].sku,
        name: req.body.name ? req.body.name.trim() : products[index].name,
        category: req.body.category ? req.body.category.trim() : products[index].category,
        unitCost: req.body.unitCost !== undefined ? parseFloat(req.body.unitCost) : products[index].unitCost,
        reorderPoint: req.body.reorderPoint !== undefined ? parseInt(req.body.reorderPoint, 10) : products[index].reorderPoint,
        updatedAt: new Date().toISOString(),
      };

      writeJsonFile(productsPath, products);
      return res.status(200).json(products[index]);
    }

    if (req.method === 'DELETE') {
      const index = products.findIndex((p) => p.id === parsedId);
      if (index === -1) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found',
        });
      }

      // Check for referential integrity
      const stock = readJsonFile(stockPath);
      const relatedStock = stock.filter((s) => s.productId === parsedId);

      if (relatedStock.length > 0 && cascade !== 'true') {
        return res.status(409).json({
          error: 'Conflict',
          message: `Cannot delete product: ${relatedStock.length} stock record(s) reference this product. Use ?cascade=true to delete with related stock records.`,
          relatedRecords: relatedStock.length,
        });
      }

      // Cascade delete if requested
      if (cascade === 'true' && relatedStock.length > 0) {
        const updatedStock = stock.filter((s) => s.productId !== parsedId);
        writeJsonFile(stockPath, updatedStock);
      }

      products.splice(index, 1);
      writeJsonFile(productsPath, products);

      return res.status(204).end();
    }

    // Method not allowed
    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Products API Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request',
    });
  }
}
