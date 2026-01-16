// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format number with commas
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Calculate stock status
export const getStockStatus = (quantity, reorderPoint) => {
  const ratio = quantity / reorderPoint;

  if (ratio === 0) {
    return { status: 'out', label: 'Out of Stock', color: 'error', severity: 4 };
  }
  if (ratio < 0.5) {
    return { status: 'critical', label: 'Critical', color: 'error', severity: 3 };
  }
  if (ratio < 1) {
    return { status: 'low', label: 'Low Stock', color: 'warning', severity: 2 };
  }
  if (ratio > 3) {
    return { status: 'overstocked', label: 'Overstocked', color: 'info', severity: 0 };
  }
  return { status: 'adequate', label: 'Adequate', color: 'success', severity: 1 };
};

// Calculate reorder recommendation
export const getReorderRecommendation = (currentStock, reorderPoint) => {
  if (currentStock >= reorderPoint) {
    return null;
  }

  // Recommend ordering enough to reach 2x the reorder point
  const targetStock = reorderPoint * 2;
  const recommendedOrder = targetStock - currentStock;

  return {
    currentStock,
    reorderPoint,
    recommendedQuantity: recommendedOrder,
    urgency: currentStock < reorderPoint * 0.5 ? 'critical' : 'normal',
  };
};

// Generate CSV from data
export const generateCSV = (data, columns) => {
  const headers = columns.map((col) => col.label).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = col.getValue ? col.getValue(row) : row[col.key];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',')
  );
  return [headers, ...rows].join('\n');
};

// Download CSV file
export const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Format relative time
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};
