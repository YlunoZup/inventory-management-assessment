// pages/api/warehouses/index.js
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'warehouses.json');

// Helper to read warehouses safely
const readWarehouses = () => {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error('Error reading warehouses file:', error.message);
    return [];
  }
};

// Helper to write warehouses safely
const writeWarehouses = (warehouses) => {
  fs.writeFileSync(filePath, JSON.stringify(warehouses, null, 2));
};

// Validate warehouse input
const validateWarehouse = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate) {
    if (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0) {
      errors.push('Code is required and must be a non-empty string');
    }
  }

  if (data.code !== undefined && (typeof data.code !== 'string' || data.code.trim().length === 0 || data.code.trim().length > 20)) {
    errors.push('Code must be a non-empty string with max 20 characters');
  }

  if (!isUpdate) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }
  }

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length === 0 || data.name.trim().length > 100)) {
    errors.push('Name must be a non-empty string with max 100 characters');
  }

  if (!isUpdate) {
    if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
      errors.push('Location is required and must be a non-empty string');
    }
  }

  if (data.location !== undefined && (typeof data.location !== 'string' || data.location.trim().length === 0 || data.location.trim().length > 200)) {
    errors.push('Location must be a non-empty string with max 200 characters');
  }

  return errors;
};

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const warehouses = readWarehouses();
      return res.status(200).json(warehouses);
    }

    if (req.method === 'POST') {
      const warehouses = readWarehouses();
      const validationErrors = validateWarehouse(req.body);

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors,
        });
      }

      // Check for duplicate code
      const existingCode = warehouses.find(
        (w) => w.code.toLowerCase() === req.body.code.trim().toLowerCase()
      );
      if (existingCode) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'A warehouse with this code already exists',
        });
      }

      const newWarehouse = {
        id: warehouses.length ? Math.max(...warehouses.map((w) => w.id)) + 1 : 1,
        code: req.body.code.trim().toUpperCase(),
        name: req.body.name.trim(),
        location: req.body.location.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      warehouses.push(newWarehouse);
      writeWarehouses(warehouses);

      return res.status(201).json(newWarehouse);
    }

    // Method not allowed
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Warehouses API Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your request',
    });
  }
}
