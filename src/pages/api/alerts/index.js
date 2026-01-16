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

// Helper to write JSON file (with error handling for read-only environments like Vercel)
const writeJsonFile = (filename, data) => {
  const filePath = path.join(process.cwd(), 'data', filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Write error (expected on Vercel):', error.message);
    return false;
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

// Calculate reorder recommendation
const getReorderRecommendation = (currentStock, reorderPoint, unitCost) => {
  if (currentStock >= reorderPoint) {
    return null;
  }

  // Recommend ordering enough to reach 2x the reorder point
  const targetStock = reorderPoint * 2;
  const recommendedQuantity = targetStock - currentStock;
  const estimatedCost = recommendedQuantity * unitCost;

  return {
    recommendedQuantity,
    estimatedCost,
    urgency: currentStock < reorderPoint * 0.5 ? 'critical' : 'normal',
    targetStock,
  };
};

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all alerts with current stock calculations
      const products = readJsonFile('products.json');
      const warehouses = readJsonFile('warehouses.json');
      const stock = readJsonFile('stock.json');
      let alertRecords = readJsonFile('alerts.json');

      // Calculate current stock status for all products
      const productAlerts = products.map((product) => {
        // Get total stock across all warehouses
        const productStock = stock.filter((s) => s.productId === product.id);
        const totalQuantity = productStock.reduce((sum, s) => sum + s.quantity, 0);
        const stockStatus = getStockStatus(totalQuantity, product.reorderPoint);
        const reorderRecommendation = getReorderRecommendation(
          totalQuantity,
          product.reorderPoint,
          product.unitCost
        );

        // Get warehouse breakdown
        const warehouseBreakdown = productStock.map((s) => {
          const warehouse = warehouses.find((w) => w.id === s.warehouseId);
          return {
            warehouseId: s.warehouseId,
            warehouseName: warehouse?.name || 'Unknown',
            warehouseCode: warehouse?.code || '',
            warehouseLocation: warehouse?.location || '',
            quantity: s.quantity,
          };
        });

        // Find existing alert record for this product
        const existingAlert = alertRecords.find((a) => a.productId === product.id);

        return {
          id: existingAlert?.id || `alert-${product.id}`,
          productId: product.id,
          product: {
            id: product.id,
            sku: product.sku,
            name: product.name,
            category: product.category,
            unitCost: product.unitCost,
            reorderPoint: product.reorderPoint,
          },
          currentStock: totalQuantity,
          stockStatus,
          reorderRecommendation,
          warehouseBreakdown,
          // Alert tracking data
          acknowledged: existingAlert?.acknowledged || false,
          acknowledgedAt: existingAlert?.acknowledgedAt || null,
          acknowledgedBy: existingAlert?.acknowledgedBy || null,
          dismissed: existingAlert?.dismissed || false,
          dismissedAt: existingAlert?.dismissedAt || null,
          notes: existingAlert?.notes || '',
          lastUpdated: new Date().toISOString(),
        };
      });

      // Sort by severity (most critical first)
      productAlerts.sort((a, b) => b.stockStatus.severity - a.stockStatus.severity);

      // Filter options from query
      const { status, category, acknowledged } = req.query;

      let filteredAlerts = productAlerts;

      if (status) {
        const statuses = status.split(',');
        filteredAlerts = filteredAlerts.filter((a) => statuses.includes(a.stockStatus.status));
      }

      if (category) {
        filteredAlerts = filteredAlerts.filter((a) => a.product.category === category);
      }

      if (acknowledged !== undefined) {
        const isAcknowledged = acknowledged === 'true';
        filteredAlerts = filteredAlerts.filter((a) => a.acknowledged === isAcknowledged);
      }

      // Calculate summary statistics
      const summary = {
        total: productAlerts.length,
        critical: productAlerts.filter((a) => a.stockStatus.status === 'critical' || a.stockStatus.status === 'out').length,
        low: productAlerts.filter((a) => a.stockStatus.status === 'low').length,
        adequate: productAlerts.filter((a) => a.stockStatus.status === 'adequate').length,
        overstocked: productAlerts.filter((a) => a.stockStatus.status === 'overstocked').length,
        needsAttention: productAlerts.filter((a) => a.stockStatus.severity >= 2 && !a.acknowledged).length,
        totalReorderValue: productAlerts
          .filter((a) => a.reorderRecommendation)
          .reduce((sum, a) => sum + (a.reorderRecommendation?.estimatedCost || 0), 0),
      };

      res.status(200).json({
        alerts: filteredAlerts,
        summary,
      });
    } else if (req.method === 'POST') {
      // Acknowledge or update an alert
      const { productId, action, notes } = req.body;

      if (!productId) {
        return res.status(400).json({
          error: 'Missing product ID',
          message: 'Product ID is required.',
        });
      }

      let alertRecords = readJsonFile('alerts.json');
      const products = readJsonFile('products.json');

      // Validate product exists
      const product = products.find((p) => p.id === parseInt(productId));
      if (!product) {
        return res.status(404).json({
          error: 'Product not found',
          message: 'The specified product does not exist.',
        });
      }

      // Find or create alert record
      let alertIndex = alertRecords.findIndex((a) => a.productId === parseInt(productId));
      const now = new Date().toISOString();

      if (alertIndex === -1) {
        // Create new alert record
        const newId = alertRecords.length ? Math.max(...alertRecords.map((a) => a.id || 0)) + 1 : 1;
        alertRecords.push({
          id: newId,
          productId: parseInt(productId),
          acknowledged: false,
          acknowledgedAt: null,
          dismissed: false,
          dismissedAt: null,
          notes: '',
          createdAt: now,
        });
        alertIndex = alertRecords.length - 1;
      }

      // Update based on action
      switch (action) {
        case 'acknowledge':
          alertRecords[alertIndex].acknowledged = true;
          alertRecords[alertIndex].acknowledgedAt = now;
          break;
        case 'unacknowledge':
          alertRecords[alertIndex].acknowledged = false;
          alertRecords[alertIndex].acknowledgedAt = null;
          break;
        case 'dismiss':
          alertRecords[alertIndex].dismissed = true;
          alertRecords[alertIndex].dismissedAt = now;
          break;
        case 'undismiss':
          alertRecords[alertIndex].dismissed = false;
          alertRecords[alertIndex].dismissedAt = null;
          break;
        case 'update_notes':
          alertRecords[alertIndex].notes = notes || '';
          break;
        default:
          return res.status(400).json({
            error: 'Invalid action',
            message: 'Valid actions are: acknowledge, unacknowledge, dismiss, undismiss, update_notes',
          });
      }

      alertRecords[alertIndex].updatedAt = now;

      // Save updated alerts (may fail on read-only environments like Vercel)
      const writeSuccess = writeJsonFile('alerts.json', alertRecords);

      res.status(200).json({
        success: true,
        alert: alertRecords[alertIndex],
        persisted: writeSuccess,
        message: writeSuccess
          ? 'Alert updated successfully'
          : 'Alert updated for this session (changes not persisted on serverless deployment)',
      });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Alerts API Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing alerts.',
    });
  }
}
