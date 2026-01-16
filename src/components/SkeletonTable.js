import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Box,
} from '@mui/material';

/**
 * Reusable skeleton table component for loading states
 * @param {number} rows - Number of skeleton rows to display (default: 5)
 * @param {number} columns - Number of columns (default: 6)
 * @param {Array} columnWidths - Optional array of column widths (e.g., ['20%', '30%', '15%', '15%', '10%', '10%'])
 * @param {boolean} showHeader - Whether to show skeleton header (default: true)
 */
export default function SkeletonTable({
  rows = 5,
  columns = 6,
  columnWidths = null,
  showHeader = true,
}) {
  const getColumnWidth = (index) => {
    if (columnWidths && columnWidths[index]) {
      return columnWidths[index];
    }
    return `${100 / columns}%`;
  };

  return (
    <TableContainer>
      <Table aria-label="Loading table content">
        {showHeader && (
          <TableHead>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableCell key={`header-${index}`} sx={{ width: getColumnWidth(index) }}>
                  <Skeleton
                    variant="text"
                    animation="wave"
                    width="80%"
                    height={24}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={`row-${rowIndex}`}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                  <Skeleton
                    variant="text"
                    animation="wave"
                    width={colIndex === 0 ? '60%' : '80%'}
                    height={20}
                  />
                  {colIndex === 0 && (
                    <Skeleton
                      variant="text"
                      animation="wave"
                      width="40%"
                      height={16}
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * Card skeleton for stat cards and summary cards
 */
export function SkeletonCard({ height = 120 }) {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="40%" height={20} />
      <Skeleton variant="text" width="60%" height={40} sx={{ my: 1 }} />
      <Skeleton variant="text" width="50%" height={16} />
    </Box>
  );
}

/**
 * Chart skeleton for loading charts
 */
export function SkeletonChart({ height = 300 }) {
  return (
    <Box sx={{ p: 2, height }}>
      <Skeleton variant="text" width="30%" height={24} sx={{ mb: 2 }} />
      <Skeleton
        variant="rectangular"
        width="100%"
        height={height - 80}
        sx={{ borderRadius: 1 }}
        animation="wave"
      />
    </Box>
  );
}
