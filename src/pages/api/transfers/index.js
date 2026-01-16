import fs from 'fs';
import path from 'path';

// Helper to read JSON file safely
const readJsonFile = (filename) => {
  const filePath = path.join(process.cwd(), 'data', filename);
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const jsonData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(jsonData);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
};

// Helper to write JSON file
const writeJsonFile = (filename, data) => {
  const filePath = path.join(process.cwd(), 'data', filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all transfers with product and warehouse details
      const transfers = readJsonFile('transfers.json');
      const products = readJsonFile('products.json');
      const warehouses = readJsonFile('warehouses.json');

      const enrichedTransfers = transfers.map((transfer) => ({
        ...transfer,
        product: products.find((p) => p.id === transfer.productId),
        fromWarehouse: warehouses.find((w) => w.id === transfer.fromWarehouseId),
        toWarehouse: warehouses.find((w) => w.id === transfer.toWarehouseId),
      }));

      // Sort by date descending (most recent first)
      enrichedTransfers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json(enrichedTransfers);
    }

    if (req.method === 'POST') {
      // Create a new transfer
      const { productId, fromWarehouseId, toWarehouseId, quantity, notes } = req.body;

      // Validation - check for undefined/null, not just falsy (0 is valid but shouldn't be)
      if (productId === undefined || productId === null) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Product ID is required.',
        });
      }

      if (fromWarehouseId === undefined || fromWarehouseId === null) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Source warehouse ID is required.',
        });
      }

      if (toWarehouseId === undefined || toWarehouseId === null) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Destination warehouse ID is required.',
        });
      }

      if (quantity === undefined || quantity === null) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Quantity is required.',
        });
      }

      const parsedProductId = parseInt(productId, 10);
      const parsedFromWarehouseId = parseInt(fromWarehouseId, 10);
      const parsedToWarehouseId = parseInt(toWarehouseId, 10);
      const parsedQuantity = parseInt(quantity, 10);

      if (isNaN(parsedProductId)) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Product ID must be a valid number.',
        });
      }

      if (isNaN(parsedFromWarehouseId) || isNaN(parsedToWarehouseId)) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Warehouse IDs must be valid numbers.',
        });
      }

      if (parsedFromWarehouseId === parsedToWarehouseId) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Source and destination warehouses must be different.',
        });
      }

      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Quantity must be a positive number.',
        });
      }

      // Read current data
      const products = readJsonFile('products.json');
      const warehouses = readJsonFile('warehouses.json');
      let stock = readJsonFile('stock.json');
      let transfers = readJsonFile('transfers.json');

      // Validate product exists
      const product = products.find((p) => p.id === parsedProductId);
      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'The specified product does not exist.',
        });
      }

      // Validate warehouses exist
      const fromWarehouse = warehouses.find((w) => w.id === parsedFromWarehouseId);
      const toWarehouse = warehouses.find((w) => w.id === parsedToWarehouseId);
      if (!fromWarehouse) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Source warehouse does not exist.',
        });
      }
      if (!toWarehouse) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Destination warehouse does not exist.',
        });
      }

      // Find source stock record
      const sourceStockIndex = stock.findIndex(
        (s) => s.productId === parsedProductId && s.warehouseId === parsedFromWarehouseId
      );

      if (sourceStockIndex === -1) {
        return res.status(400).json({
          error: 'No stock available',
          message: `${product.name} is not available at ${fromWarehouse.name}.`,
        });
      }

      const sourceStock = stock[sourceStockIndex];

      // Check if enough stock is available
      if (sourceStock.quantity < parsedQuantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Only ${sourceStock.quantity} units available at ${fromWarehouse.name}. Cannot transfer ${parsedQuantity} units.`,
          available: sourceStock.quantity,
        });
      }

      // Update source stock
      stock[sourceStockIndex].quantity -= parsedQuantity;
      stock[sourceStockIndex].updatedAt = new Date().toISOString();

      // Find or create destination stock record
      let destStockIndex = stock.findIndex(
        (s) => s.productId === parsedProductId && s.warehouseId === parsedToWarehouseId
      );

      if (destStockIndex === -1) {
        // Create new stock record at destination
        const newStockId = stock.length ? Math.max(...stock.map((s) => s.id)) + 1 : 1;
        stock.push({
          id: newStockId,
          productId: parsedProductId,
          warehouseId: parsedToWarehouseId,
          quantity: parsedQuantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Update existing stock at destination
        stock[destStockIndex].quantity += parsedQuantity;
        stock[destStockIndex].updatedAt = new Date().toISOString();
      }

      // Create transfer record
      const newTransferId = transfers.length ? Math.max(...transfers.map((t) => t.id)) + 1 : 1;
      const newTransfer = {
        id: newTransferId,
        productId: parsedProductId,
        fromWarehouseId: parsedFromWarehouseId,
        toWarehouseId: parsedToWarehouseId,
        quantity: parsedQuantity,
        notes: notes ? notes.trim().substring(0, 500) : '',
        status: 'completed',
        createdAt: new Date().toISOString(),
      };

      transfers.push(newTransfer);

      // Save updated data
      writeJsonFile('stock.json', stock);
      writeJsonFile('transfers.json', transfers);

      // Return enriched transfer
      return res.status(201).json({
        ...newTransfer,
        product,
        fromWarehouse,
        toWarehouse,
      });
    }

    // Method not allowed
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Transfer API Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing the transfer.',
    });
  }
}
