// pages/api/stock/[id].js
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

// Validate stock update input
const validateStockUpdate = (data, products, warehouses) => {
  const errors = [];

  if (data.productId !== undefined) {
    const productId = parseInt(data.productId, 10);
    if (isNaN(productId)) {
      errors.push('Product ID must be a valid number');
    } else if (!products.find((p) => p.id === productId)) {
      errors.push('Product not found');
    }
  }

  if (data.warehouseId !== undefined) {
    const warehouseId = parseInt(data.warehouseId, 10);
    if (isNaN(warehouseId)) {
      errors.push('Warehouse ID must be a valid number');
    } else if (!warehouses.find((w) => w.id === warehouseId)) {
      errors.push('Warehouse not found');
    }
  }

  if (data.quantity !== undefined) {
    const quantity = parseInt(data.quantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      errors.push('Quantity must be a non-negative integer');
    }
  }

  return errors;
};

export default function handler(req, res) {
  try {
    const { id } = req.query;
    const parsedId = parseInt(id, 10);

    if (isNaN(parsedId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid stock ID',
      });
    }

    const stock = readJsonFile(stockPath);

    if (req.method === 'GET') {
      const stockItem = stock.find((s) => s.id === parsedId);
      if (stockItem) {
        return res.status(200).json(stockItem);
      }
      return res.status(404).json({
        error: 'Not Found',
        message: 'Stock item not found',
      });
    }

    if (req.method === 'PUT') {
      const index = stock.findIndex((s) => s.id === parsedId);
      if (index === -1) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Stock item not found',
        });
      }

      const products = readJsonFile(productsPath);
      const warehouses = readJsonFile(warehousesPath);

      const validationErrors = validateStockUpdate(req.body, products, warehouses);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors,
        });
      }

      const productId = req.body.productId !== undefined
        ? parseInt(req.body.productId, 10)
        : stock[index].productId;
      const warehouseId = req.body.warehouseId !== undefined
        ? parseInt(req.body.warehouseId, 10)
        : stock[index].warehouseId;

      // Check for duplicate stock record if changing product or warehouse
      if (productId !== stock[index].productId || warehouseId !== stock[index].warehouseId) {
        const existingStock = stock.find(
          (s) => s.productId === productId && s.warehouseId === warehouseId && s.id !== parsedId
        );
        if (existingStock) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'A stock record for this product and warehouse already exists',
            existingId: existingStock.id,
          });
        }
      }

      stock[index] = {
        ...stock[index],
        id: parsedId,
        productId,
        warehouseId,
        quantity: req.body.quantity !== undefined
          ? parseInt(req.body.quantity, 10)
          : stock[index].quantity,
        updatedAt: new Date().toISOString(),
      };

      writeJsonFile(stockPath, stock);
      return res.status(200).json(stock[index]);
    }

    if (req.method === 'DELETE') {
      const index = stock.findIndex((s) => s.id === parsedId);
      if (index === -1) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Stock item not found',
        });
      }

      stock.splice(index, 1);
      writeJsonFile(stockPath, stock);

      return res.status(204).end();
    }

    // Method not allowed
    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Stock API Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request',
    });
  }
}
