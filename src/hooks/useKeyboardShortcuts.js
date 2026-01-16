import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

// Define keyboard shortcuts
export const SHORTCUTS = {
  // Navigation
  GO_HOME: { key: 'h', ctrl: true, description: 'Go to Dashboard' },
  GO_PRODUCTS: { key: 'p', ctrl: true, description: 'Go to Products' },
  GO_STOCK: { key: 's', ctrl: true, description: 'Go to Stock' },
  GO_WAREHOUSES: { key: 'w', ctrl: true, description: 'Go to Warehouses' },
  GO_TRANSFERS: { key: 't', ctrl: true, description: 'Go to Transfers' },
  GO_ALERTS: { key: 'a', ctrl: true, description: 'Go to Alerts' },

  // Actions
  NEW_ITEM: { key: 'n', ctrl: true, description: 'Create new item' },
  SEARCH: { key: '/', description: 'Focus search' },
  EXPORT: { key: 'e', ctrl: true, description: 'Export data' },
  REFRESH: { key: 'r', ctrl: true, description: 'Refresh data' },

  // Dialog
  CLOSE_DIALOG: { key: 'Escape', description: 'Close dialog/modal' },
  SHOW_SHORTCUTS: { key: '?', shift: true, description: 'Show shortcuts' },
};

// Navigation routes
const ROUTES = {
  GO_HOME: '/',
  GO_PRODUCTS: '/products',
  GO_STOCK: '/stock',
  GO_WAREHOUSES: '/warehouses',
  GO_TRANSFERS: '/transfers',
  GO_ALERTS: '/alerts',
};

// New item routes
const NEW_ROUTES = {
  '/products': '/products/add',
  '/stock': '/stock/add',
  '/warehouses': '/warehouses/add',
  '/transfers': '/transfers', // Transfer form is on the same page
};

export function useKeyboardShortcuts({
  onSearch,
  onExport,
  onRefresh,
  onNew,
  onShowShortcuts,
  onCloseDialog,
  enabled = true,
} = {}) {
  const router = useRouter();

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target;
    const isInputField =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable;

    // Allow Escape in input fields
    if (isInputField && event.key !== 'Escape') {
      // Allow Ctrl+key shortcuts even in input fields
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
    }

    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;

    // Navigation shortcuts (Ctrl+key)
    if (ctrl && !shift) {
      switch (key) {
        case 'h':
          event.preventDefault();
          router.push('/');
          break;
        case 'p':
          event.preventDefault();
          router.push('/products');
          break;
        case 's':
          // Don't override browser save
          if (!event.shiftKey) {
            event.preventDefault();
            router.push('/stock');
          }
          break;
        case 'w':
          event.preventDefault();
          router.push('/warehouses');
          break;
        case 't':
          event.preventDefault();
          router.push('/transfers');
          break;
        case 'a':
          // Don't override select all
          event.preventDefault();
          router.push('/alerts');
          break;
        case 'n':
          event.preventDefault();
          if (onNew) {
            onNew();
          } else {
            const newRoute = NEW_ROUTES[router.pathname];
            if (newRoute) {
              router.push(newRoute);
            }
          }
          break;
        case 'e':
          event.preventDefault();
          if (onExport) {
            onExport();
          }
          break;
        case 'r':
          event.preventDefault();
          if (onRefresh) {
            onRefresh();
          }
          break;
        default:
          break;
      }
    }

    // Non-Ctrl shortcuts
    if (!ctrl) {
      // Search shortcut (/)
      if (key === '/' && !shift) {
        if (!isInputField) {
          event.preventDefault();
          if (onSearch) {
            onSearch();
          } else {
            // Try to focus search input
            const searchInput = document.querySelector('input[placeholder*="Search"]');
            if (searchInput) {
              searchInput.focus();
            }
          }
        }
      }

      // Show shortcuts (?)
      if (key === '?' || (shift && key === '/')) {
        if (!isInputField) {
          event.preventDefault();
          if (onShowShortcuts) {
            onShowShortcuts();
          }
        }
      }

      // Escape
      if (key === 'escape') {
        if (onCloseDialog) {
          onCloseDialog();
        }
        // Also blur current element
        if (document.activeElement) {
          document.activeElement.blur();
        }
      }
    }
  }, [enabled, router, onSearch, onExport, onRefresh, onNew, onShowShortcuts, onCloseDialog]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  return { shortcuts: SHORTCUTS };
}

export default useKeyboardShortcuts;
