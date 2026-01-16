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
    const { id } = req.query;
    const transferId = parseInt(id, 10);

    if (isNaN(transferId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid transfer ID',
      });
    }

    if (req.method === 'GET') {
      const transfers = readJsonFile('transfers.json');
      const products = readJsonFile('products.json');
      const warehouses = readJsonFile('warehouses.json');

      const transfer = transfers.find((t) => t.id === transferId);

      if (!transfer) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Transfer with ID ${transferId} does not exist.`,
        });
      }

      // Enrich with product and warehouse details
      const enrichedTransfer = {
        ...transfer,
        product: products.find((p) => p.id === transfer.productId),
        fromWarehouse: warehouses.find((w) => w.id === transfer.fromWarehouseId),
        toWarehouse: warehouses.find((w) => w.id === transfer.toWarehouseId),
      };

      return res.status(200).json(enrichedTransfer);
    }

    if (req.method === 'DELETE') {
      // Delete transfer (without reversing stock - for audit purposes)
      let transfers = readJsonFile('transfers.json');

      const transferIndex = transfers.findIndex((t) => t.id === transferId);

      if (transferIndex === -1) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Transfer with ID ${transferId} does not exist.`,
        });
      }

      transfers.splice(transferIndex, 1);
      writeJsonFile('transfers.json', transfers);

      return res.status(204).end();
    }

    // Method not allowed
    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Transfer API Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while processing the request.',
    });
  }
}
