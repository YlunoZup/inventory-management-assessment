import fs from 'fs';
import path from 'path';

// Helper to read JSON file
const readJsonFile = (filename) => {
  const filePath = path.join(process.cwd(), 'data', filename);
  try {
    const jsonData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(jsonData);
  } catch {
    return [];
  }
};

// Calculate stock status
const getStockStatus = (quantity, reorderPoint) => {
  const ratio = quantity / reorderPoint;

  if (ratio === 0) {
    return { status: 'out', label: 'Out of Stock', color: 'error', severity: 4, priority: 'critical' };
  }
  if (ratio < 0.5) {
    return { status: 'critical', label: 'Critical', color: 'error', severity: 3, priority: 'high' };
  }
  if (ratio < 1) {
    return { status: 'low', label: 'Low Stock', color: 'warning', severity: 2, priority: 'medium' };
  }
  if (ratio > 3) {
    return { status: 'overstocked', label: 'Overstocked', color: 'info', severity: 0, priority: 'low' };
  }
  return { status: 'adequate', label: 'Adequate', color: 'success', severity: 1, priority: 'none' };
};

export default function handler(req, res) {
  const { productId } = req.query;
  const parsedProductId = parseInt(productId, 10);

  try {
    if (req.method === 'GET') {
      const products = readJsonFile('products.json');
      const warehouses = readJsonFile('warehouses.json');
      const stock = readJsonFile('stock.json');
      const alertRecords = readJsonFile('alerts.json');

      const product = products.find((p) => p.id === parsedProductId);
      if (!product) {
        return res.status(404).json({
          error: 'Product not found',
          message: `Product with ID ${parsedProductId} does not exist.`,
        });
      }

      // Get total stock across all warehouses
      const productStock = stock.filter((s) => s.productId === parsedProductId);
      const totalQuantity = productStock.reduce((sum, s) => sum + s.quantity, 0);
      const stockStatus = getStockStatus(totalQuantity, product.reorderPoint);

      // Get warehouse breakdown
      const warehouseBreakdown = productStock.map((s) => {
        const warehouse = warehouses.find((w) => w.id === s.warehouseId);
        return {
          warehouseId: s.warehouseId,
          warehouseName: warehouse?.name || 'Unknown',
          warehouseCode: warehouse?.code || '',
          quantity: s.quantity,
        };
      });

      // Find existing alert record
      const existingAlert = alertRecords.find((a) => a.productId === parsedProductId);

      const alert = {
        productId: parsedProductId,
        product,
        currentStock: totalQuantity,
        stockStatus,
        warehouseBreakdown,
        acknowledged: existingAlert?.acknowledged || false,
        acknowledgedAt: existingAlert?.acknowledgedAt || null,
        notes: existingAlert?.notes || '',
      };

      res.status(200).json(alert);
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Alert API Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching the alert.',
    });
  }
}
