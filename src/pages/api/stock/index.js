// pages/api/stock/index.js
import fs from 'fs';
import path from 'path';

const stockPath = path.join(process.cwd(), 'data', 'stock.json');
const productsPath = path.join(process.cwd(), 'data', 'products.json');
const warehousesPath = path.join(process.cwd(), 'data', 'warehouses.json');

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

// Validate stock input
const validateStock = (data, products, warehouses) => {
  const errors = [];

  if (data.productId === undefined || data.productId === null) {
    errors.push('Product ID is required');
  } else {
    const productId = parseInt(data.productId, 10);
    if (isNaN(productId)) {
      errors.push('Product ID must be a valid number');
    } else if (!products.find((p) => p.id === productId)) {
      errors.push('Product not found');
    }
  }

  if (data.warehouseId === undefined || data.warehouseId === null) {
    errors.push('Warehouse ID is required');
  } else {
    const warehouseId = parseInt(data.warehouseId, 10);
    if (isNaN(warehouseId)) {
      errors.push('Warehouse ID must be a valid number');
    } else if (!warehouses.find((w) => w.id === warehouseId)) {
      errors.push('Warehouse not found');
    }
  }

  if (data.quantity === undefined || data.quantity === null) {
    errors.push('Quantity is required');
  } else {
    const quantity = parseInt(data.quantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      errors.push('Quantity must be a non-negative integer');
    }
  }

  return errors;
};

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const stock = readJsonFile(stockPath);
      return res.status(200).json(stock);
    }

    if (req.method === 'POST') {
      const stock = readJsonFile(stockPath);
      const products = readJsonFile(productsPath);
      const warehouses = readJsonFile(warehousesPath);

      const validationErrors = validateStock(req.body, products, warehouses);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors,
        });
      }

      const productId = parseInt(req.body.productId, 10);
      const warehouseId = parseInt(req.body.warehouseId, 10);
      const quantity = parseInt(req.body.quantity, 10);

      // Check for duplicate stock record
      const existingStock = stock.find(
        (s) => s.productId === productId && s.warehouseId === warehouseId
      );
      if (existingStock) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'A stock record for this product and warehouse already exists. Use PUT to update.',
          existingId: existingStock.id,
        });
      }

      const newStock = {
        id: stock.length ? Math.max(...stock.map((s) => s.id)) + 1 : 1,
        productId,
        warehouseId,
        quantity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      stock.push(newStock);
      writeJsonFile(stockPath, stock);

      return res.status(201).json(newStock);
    }

    // Method not allowed
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Stock API Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request',
    });
  }
}
