import { useState } from 'react';
import { TablePagination as MuiTablePagination } from '@mui/material';
import { PAGINATION } from '@/constants';

/**
 * Reusable table pagination component with consistent styling and behavior
 */
export default function TablePagination({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = PAGINATION.ROWS_PER_PAGE_OPTIONS,
  component = 'div',
  labelRowsPerPage = 'Rows per page:',
  showFirstButton = true,
  showLastButton = true,
  ...props
}) {
  const handleChangePage = (event, newPage) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
  };

  return (
    <MuiTablePagination
      component={component}
      count={count}
      page={page}
      onPageChange={handleChangePage}
      rowsPerPage={rowsPerPage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      rowsPerPageOptions={rowsPerPageOptions}
      labelRowsPerPage={labelRowsPerPage}
      showFirstButton={showFirstButton}
      showLastButton={showLastButton}
      aria-label="Table pagination"
      SelectProps={{
        inputProps: {
          'aria-label': 'Rows per page',
        },
        native: true,
      }}
      {...props}
    />
  );
}

/**
 * Custom hook for managing pagination state
 */
export function usePagination(initialRowsPerPage = PAGINATION.DEFAULT_ROWS_PER_PAGE) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const resetPage = () => {
    setPage(0);
  };

  const paginateData = (data) => {
    const startIndex = page * rowsPerPage;
    return data.slice(startIndex, startIndex + rowsPerPage);
  };

  return {
    page,
    rowsPerPage,
    handlePageChange,
    handleRowsPerPageChange,
    resetPage,
    paginateData,
  };
}
