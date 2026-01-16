// pages/api/warehouses/[id].js
import fs from 'fs';
import path from 'path';

const warehousesPath = path.join(process.cwd(), 'data', 'warehouses.json');
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

// Validate warehouse update input
const validateWarehouseUpdate = (data) => {
  const errors = [];

  if (data.code !== undefined && (typeof data.code !== 'string' || data.code.trim().length === 0 || data.code.trim().length > 20)) {
    errors.push('Code must be a non-empty string with max 20 characters');
  }

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length === 0 || data.name.trim().length > 100)) {
    errors.push('Name must be a non-empty string with max 100 characters');
  }

  if (data.location !== undefined && (typeof data.location !== 'string' || data.location.trim().length === 0 || data.location.trim().length > 200)) {
    errors.push('Location must be a non-empty string with max 200 characters');
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
        message: 'Invalid warehouse ID',
      });
    }

    const warehouses = readJsonFile(warehousesPath);

    if (req.method === 'GET') {
      const warehouse = warehouses.find((w) => w.id === parsedId);
      if (warehouse) {
        return res.status(200).json(warehouse);
      }
      return res.status(404).json({
        error: 'Not Found',
        message: 'Warehouse not found',
      });
    }

    if (req.method === 'PUT') {
      const index = warehouses.findIndex((w) => w.id === parsedId);
      if (index === -1) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Warehouse not found',
        });
      }

      const validationErrors = validateWarehouseUpdate(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors,
        });
      }

      // Check for duplicate code if being changed
      if (req.body.code && req.body.code.trim().toLowerCase() !== warehouses[index].code.toLowerCase()) {
        const existingCode = warehouses.find(
          (w) => w.code.toLowerCase() === req.body.code.trim().toLowerCase() && w.id !== parsedId
        );
        if (existingCode) {
          return res.status(409).json({
            error: 'Conflict',
            message: 'A warehouse with this code already exists',
          });
        }
      }

      warehouses[index] = {
        ...warehouses[index],
        id: parsedId,
        code: req.body.code ? req.body.code.trim().toUpperCase() : warehouses[index].code,
        name: req.body.name ? req.body.name.trim() : warehouses[index].name,
        location: req.body.location ? req.body.location.trim() : warehouses[index].location,
        updatedAt: new Date().toISOString(),
      };

      writeJsonFile(warehousesPath, warehouses);
      return res.status(200).json(warehouses[index]);
    }

    if (req.method === 'DELETE') {
      const index = warehouses.findIndex((w) => w.id === parsedId);
      if (index === -1) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Warehouse not found',
        });
      }

      // Check for referential integrity
      const stock = readJsonFile(stockPath);
      const relatedStock = stock.filter((s) => s.warehouseId === parsedId);

      if (relatedStock.length > 0 && cascade !== 'true') {
        return res.status(409).json({
          error: 'Conflict',
          message: `Cannot delete warehouse: ${relatedStock.length} stock record(s) reference this warehouse. Use ?cascade=true to delete with related stock records.`,
          relatedRecords: relatedStock.length,
        });
      }

      // Cascade delete if requested
      if (cascade === 'true' && relatedStock.length > 0) {
        const updatedStock = stock.filter((s) => s.warehouseId !== parsedId);
        writeJsonFile(stockPath, updatedStock);
      }

      warehouses.splice(index, 1);
      writeJsonFile(warehousesPath, warehouses);

      return res.status(204).end();
    }

    // Method not allowed
    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Warehouses API Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request',
    });
  }
}
