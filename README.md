# Multi-Warehouse Inventory Management System

## Overview
Enhance the existing Multi-Warehouse Inventory Management System built with Next.js and Material-UI (MUI) for GreenSupply Co, a sustainable product distribution company. The current system is functional but needs significant improvements to be production-ready.

## 🎯 Business Context
GreenSupply Co distributes eco-friendly products across multiple warehouse locations throughout North America. They need to efficiently track inventory across warehouses, manage stock movements, monitor inventory values, and prevent stockouts. This system is critical for their daily operations and customer satisfaction.

## 🛠️ Tech Stack
- [Next.js](https://nextjs.org/) - React framework
- [Material-UI (MUI)](https://mui.com/) - UI component library
- [React](https://reactjs.org/) - JavaScript library
- JSON file storage (for this assessment)

## 📋 Current Features (Already Implemented)
The basic system includes:
- ✅ Products management (CRUD operations)
- ✅ Warehouse management (CRUD operations)
- ✅ Stock level tracking per warehouse
- ✅ Basic dashboard with inventory overview
- ✅ Navigation between pages
- ✅ Data persistence using JSON files

**⚠️ Note:** The current UI is intentionally basic. We want to see YOUR design skills and creativity.

---

## 🚀 Your Tasks (Complete ALL 3)

---

## Task 1: Redesign & Enhance the Dashboard

**Objective:** Transform the basic dashboard into a professional, insightful command center for warehouse operations.

### Requirements:

Redesign the dashboard to provide warehouse managers with actionable insights at a glance. Your implementation should include:

- **Modern, professional UI** appropriate for a sustainable/eco-friendly company
- **Key business metrics** (inventory value, stock levels, warehouse counts, etc.)
- **Data visualizations** using a charting library of your choice
- **Enhanced inventory overview** with improved usability
- **Fully responsive design** that works across all device sizes
- **Proper loading states** and error handling

Focus on creating an interface that balances visual appeal with practical functionality for daily warehouse operations.

---

## Task 2: Implement Stock Transfer System

**Objective:** Build a complete stock transfer workflow with proper business logic, validation, and data integrity.

### Requirements:

**A. Stock Transfer System**

Build a complete stock transfer system that allows moving inventory between warehouses. Your implementation should include:

- Data persistence for transfer records (create `data/transfers.json`)
- API endpoints for creating and retrieving transfers
- Proper validation and error handling
- Stock level updates across warehouses
- Transfer history tracking

Design the data structure, API contracts, and business logic as you see fit for a production system.

**B. Transfer Page UI**

Create a `/transfers` page that provides:
- A form to initiate stock transfers between warehouses
- Transfer history view
- Appropriate error handling and user feedback

Design the interface to be intuitive for warehouse managers performing daily operations.

---

## Task 3: Build Low Stock Alert & Reorder System

**Objective:** Create a practical system that helps warehouse managers identify and act on low stock situations.

### Requirements:

Build a low stock alert and reorder recommendation system that helps warehouse managers proactively manage inventory levels.

**Key Functionality:**
- Identify products that need reordering based on current stock levels and reorder points
- Categorize inventory by stock status (critical, low, adequate, overstocked)
- Provide actionable reorder recommendations
- Allow managers to track and update alert status
- Integrate alerts into the main dashboard

**Implementation Details:**
- Create an `/alerts` page for viewing and managing alerts
- Calculate stock across all warehouses
- Persist alert tracking data (create `data/alerts.json`)
- Design appropriate status workflows and user actions

Use your judgment to determine appropriate thresholds, calculations, and user workflows for a production inventory management system.

---

## 📦 Getting Started

### Prerequisites
- Node.js (v16 or higher recommended)
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Screen recording software for video submission (Loom, OBS, QuickTime, etc.)

### Installation
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser to http://localhost:3000
```

### Project Structure
```
inventory-management-task/
├── data/                  # JSON data files
├── src/
│   └── pages/            # Next.js pages and API routes
└── package.json
```

The existing codebase includes product, warehouse, and stock management features. Explore the code to understand the current implementation before starting your tasks.

---

## 📝 Submission Requirements

### 1. Code Submission
- Push your code to **your own GitHub repository** (fork or new repo)
- Clear commit history showing your progression
- Update `package.json` with any new dependencies
- Application must run with: `npm install && npm run dev`

### 2. Video Walkthrough (5-10 minutes) - REQUIRED ⚠️

Record a video demonstration covering:

**Feature Demo (4-5 minutes)**
- Redesigned dashboard walkthrough (demonstrate responsiveness)
- Stock transfer workflow (show both successful and error scenarios)
- Alert system functionality

**Code Explanation (3-4 minutes)**
- Key technical decisions and approach
- Most challenging aspects and solutions
- Code structure highlights

**Reflection (1-2 minutes)**
- What you're proud of
- Known limitations or trade-offs
- What you'd improve with more time

**Format:** Upload to YouTube (unlisted), Loom, or similar platform. Include link in your README.

### 3. Update This README

Add an implementation summary at the bottom with:
- Your name and completion time
- Features completed
- Key technical decisions
- Known limitations
- Testing instructions
- Video walkthrough link
- Any new dependencies added

---

## ⏰ Timeline

**Deadline:** 3 days (72 hours) from receiving this assignment

Submit:
1. GitHub repository link
2. Video walkthrough link
3. Updated README with implementation notes

**Estimated effort:** 15-18 hours total

**Note:** This timeline reflects real-world project constraints. Manage your time effectively and prioritize core functionality over bonus features.

---

## 🏆 Optional Enhancements

If you have extra time, consider adding:
- Live deployment (Vercel/Netlify)
- Dark mode
- Export functionality (CSV/PDF)
- Keyboard shortcuts
- Advanced filtering
- Accessibility features
- Unit tests
- TypeScript
- Additional features you think add value

**Important:** Complete all 3 core tasks before attempting bonuses. Quality of required features matters more than quantity of extras.

---

## 🤔 Frequently Asked Questions

**Q: Can I use additional libraries?**
A: Yes! Add them to package.json and document your reasoning.

**Q: What if I encounter technical blockers?**
A: Document the issue, explain what you tried, and move forward with the next task. Include this in your video explanation.

**Q: Can I modify the existing data structure?**
A: You can add fields, but don't break the existing structure that other features depend on.

**Q: What if I can't complete everything?**
A: Submit what you have with clear documentation. Quality over quantity.

**Q: How will my submission be used?**
A: This is solely for technical assessment. Your code will not be used commercially.

---

## 🚀 Final Notes

This assessment is designed to simulate real-world development scenarios. We're looking for:
- Clean, maintainable code
- Thoughtful problem-solving
- Professional UI/UX
- Proper error handling
- Good communication skills (via your video)

Do your best work, document your decisions, and show us how you approach building production applications.

Good luck! 💪

---

**Setup issues?** Verify Node.js is installed and you're using a modern browser. If problems persist, document them in your submission.

---

# Implementation Summary

## Overview

This implementation completes all 3 required tasks plus extensive additional enhancements through 5 comprehensive iterations of improvement, resulting in a production-quality inventory management system.

---

## Core Tasks Completed

### Task 1: Dashboard Redesign ✅
- **Modern Eco-Friendly Design**: Cohesive green/teal color palette reflecting GreenSupply Co's sustainable brand identity
- **Key Business Metrics**: Four stat cards displaying Total Products, Warehouses, Total Units, and Inventory Value
- **Stock Status Overview**: Visual cards showing Critical/Out, Low Stock, Adequate, and Overstocked product counts
- **Data Visualizations**:
  - Bar chart showing units and value distribution across warehouses
  - Pie chart displaying inventory value by category
- **Quick Actions Panel**: Easy access buttons for common tasks (transfers, add product, view alerts, export)
- **Attention Required Section**: Highlights products with low/critical stock levels
- **Complete Inventory Table**: Shows all products with stock levels, progress bars, status indicators, and values
- **Dark/Light Mode Toggle**: Full theme switching support with localStorage persistence
- **Responsive Design**: Works across desktop, tablet, and mobile devices
- **Loading States & Error Handling**: Implemented throughout with retry functionality

### Task 2: Stock Transfer System ✅
- **Data Persistence**: Created `data/transfers.json` for transfer history
- **API Endpoints**:
  - `GET /api/transfers` - Retrieve all transfers with product/warehouse details
  - `POST /api/transfers` - Create new transfer with full validation
  - `GET /api/transfers/[id]` - Get single transfer by ID
  - `DELETE /api/transfers/[id]` - Delete transfer record
- **Business Logic**:
  - Validates product existence and warehouse validity
  - Checks available stock at source warehouse
  - Automatically updates stock levels at both source and destination
  - Creates or updates stock records as needed
- **Transfer Page UI** (`/transfers`):
  - Smart transfer form with cascading dropdowns
  - Shows available stock at selected source warehouse
  - "Max" button to quickly transfer entire stock
  - Transfer history table with search and filter
  - Transfer detail dialog
  - Export to CSV functionality
  - Pre-fill from alerts page via query parameter

### Task 3: Low Stock Alert System ✅
- **Data Persistence**: Created `data/alerts.json` for alert tracking
- **API Endpoints**:
  - `GET /api/alerts` - Get real-time stock status calculations with summary stats
  - `POST /api/alerts` - Acknowledge/dismiss alerts
  - `PATCH /api/alerts/[productId]` - Update alert status
- **Stock Status Categories**:
  - **Out of Stock**: 0 units (Severity 4)
  - **Critical**: < 25% of reorder point (Severity 3)
  - **Low**: < 100% of reorder point (Severity 2)
  - **Adequate**: 100-200% of reorder point (Severity 1)
  - **Overstocked**: > 200% of reorder point (Severity 0)
- **Alerts Page UI** (`/alerts`):
  - Tab-based filtering (Needs Attention, All, Critical, Low, Acknowledged)
  - Reorder recommendations with calculated quantities and estimated costs
  - Alert detail dialog with warehouse breakdown
  - Acknowledge/dismiss functionality with quick action buttons
  - Direct link to create transfer from alert
  - Export to CSV

---

## Additional Enhancements (10 Iterations)

### Iteration 1: Critical Bug Fixes & Error Handling ✅
- Added try-catch error handling to all 8 API routes
- Comprehensive input validation for all POST/PUT endpoints
- Fixed type coercion bugs (consistent parseInt usage)
- Fixed Allow header format (string vs array)
- Added DELETE endpoint for transfers

### Iteration 2: UI/UX & Accessibility ✅
- Added ARIA labels to navigation and interactive elements
- Added aria-current for active navigation items
- Added aria-hidden for decorative icons
- Created reusable TablePagination component with usePagination hook
- Created SkeletonTable component for loading states
- Created ConfirmDialog component for consistent confirmations

### Iteration 3: Data Integrity & API Robustness ✅
- Added referential integrity checks before deleting products/warehouses
- Implemented cascade delete option (`?cascade=true` query parameter)
- Created comprehensive validation schemas (`src/utils/validation.js`)
- Added audit timestamps (createdAt, updatedAt) to all records
- Prevented negative quantities in all operations

### Iteration 4: Performance & Code Quality ✅
- Created useDebounce hook for search inputs
- Created constants file with all app-wide configuration
- Extracted stock status logic to shared utilities
- Consolidated error handling patterns across API routes
- Created reusable components to reduce duplication

### Iteration 5: Documentation & Final Polish ✅
- Created comprehensive INFRASTRUCTURE.txt
- Updated README with complete implementation details
- Verified production build passes successfully

### Iteration 6: Enhanced Form UX & Dropdown Labels ✅
- Added proper FormControl/InputLabel/Select patterns to all dropdowns
- Added placeholder text to all filter dropdowns ("All Warehouses", "All Products", etc.)
- Fixed unlabeled dropdown fields on Stock page
- Enhanced form validation with better error messages

### Iteration 7: Advanced Search & Keyboard Shortcuts ✅
- **Stock Page Enhancements**:
  - Summary statistics cards (Total Value, Total Units, Products Tracked, Low Stock)
  - Column sorting with TableSortLabel on all columns
  - Pagination with configurable rows per page
  - Collapsible filter section
  - Stock status filter dropdown
- **Products Page Enhancements**:
  - Summary statistics (Total Products, Categories, Inventory Value, Avg Unit Cost)
  - Product detail dialog with warehouse distribution
  - Stock level progress bars with color coding
- **Warehouses Page Enhancements**:
  - Summary statistics (Total Warehouses, Total Units, Total Value, Utilization)
  - Warehouse detail dialog with utilization metrics
  - Product coverage progress indicators
- **Transfers Page Enhancements**:
  - Summary statistics (Today's Transfers, This Week, Total Units Moved, Total Value)
  - Column sorting and pagination
  - Transfer detail dialog
- **Alerts Page Enhancements**:
  - Column sorting on all columns
  - Pagination controls
  - Properly labeled category filter
- **Global Keyboard Shortcuts** (press ? to view):
  - Navigation: Ctrl+H (Dashboard), Ctrl+P (Products), Ctrl+S (Stock), Ctrl+W (Warehouses), Ctrl+T (Transfers), Ctrl+A (Alerts)
  - Actions: / (Search), Ctrl+N (New), Ctrl+E (Export), Ctrl+R (Refresh), Esc (Close)
  - Keyboard shortcuts dialog and sidebar hints

### Iteration 8: Activity Feed & Real-Time Updates ✅
- **Dashboard Activity Feed**:
  - Recent transfers with product and warehouse details
  - Low stock alerts integrated into feed
  - Auto-refresh every 30 seconds
  - Skeleton loading states
  - Link to view all transfers
- **StatCard Enhancements**:
  - Optional sparkline data visualization
  - Loading skeleton state
  - Click handler support
  - Background gradient accents
  - Smooth icon scale animation on hover

### Iteration 9: Micro-Interactions & Animations ✅
- Added CSS keyframe animations for stat cards
- Icon scale animations on hover
- Smooth transitions on all interactive elements
- Fade-in animations for trend indicators
- Gradient background accents on cards

### Iteration 10: Final Polish & Documentation ✅
- Added react-sparklines library for mini charts
- Enhanced hover effects across all cards
- Verified production build passes
- Updated README with comprehensive documentation

---

## Key Technical Decisions

1. **Dynamic Imports for SSR**: Used `next/dynamic` with `ssr: false` for ThemeContextProvider and SnackbarProvider to prevent hydration issues with browser-only features

2. **MUI v6 with Custom Theme**: Extended MUI's theming system with eco-friendly color palette and custom component overrides

3. **Recharts for Visualization**: Chose for its React-native approach, responsive containers, and TypeScript support

4. **Real-Time Stock Calculation**: Alerts calculated in real-time from stock data for accuracy

5. **Referential Integrity**: API validates foreign key relationships and offers cascade delete option

6. **Comprehensive Validation**: Both client-side form validation and server-side API validation

---

## New Dependencies

```json
{
  "recharts": "^2.12.7",          // Charts and data visualization
  "date-fns": "^4.1.0",           // Date formatting utilities
  "notistack": "^3.0.2",          // Toast notifications
  "react-sparklines": "^1.7.0"    // Mini sparkline charts in stat cards
}
```

---

## Project Structure

```
inventory-management-system/
├── data/                          # JSON data files
│   ├── products.json
│   ├── warehouses.json
│   ├── stock.json
│   ├── transfers.json             # Transfer history
│   └── alerts.json                # Alert tracking
│
├── src/
│   ├── components/                # Reusable UI components
│   │   ├── Layout.js              # Main layout with navigation & keyboard shortcuts
│   │   ├── StatCard.js            # Dashboard metrics with sparklines
│   │   ├── StockStatusChip.js     # Status indicators
│   │   ├── LoadingScreen.js       # Loading states
│   │   ├── ErrorDisplay.js        # Error handling
│   │   ├── EmptyState.js          # Empty data states
│   │   ├── TablePagination.js     # Pagination controls
│   │   ├── SkeletonTable.js       # Loading skeletons
│   │   ├── ConfirmDialog.js       # Confirmation modals
│   │   ├── ActivityFeed.js        # Real-time activity feed
│   │   └── KeyboardShortcuts.js   # Keyboard shortcuts dialog
│   │
│   ├── constants/                 # App configuration
│   │   └── index.js               # Categories, thresholds, limits
│   │
│   ├── context/                   # React contexts
│   │   └── ThemeContext.js        # Theme management
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── useDebounce.js         # Debounced values
│   │   └── useKeyboardShortcuts.js # Global keyboard shortcuts
│   │
│   ├── pages/                     # Pages and API routes
│   │   ├── index.js               # Dashboard with activity feed
│   │   ├── products/              # Product CRUD with sorting/pagination
│   │   ├── warehouses/            # Warehouse CRUD with sorting/pagination
│   │   ├── stock/                 # Stock management with advanced filters
│   │   ├── transfers/             # Transfer system with sorting/pagination
│   │   ├── alerts/                # Alert management with sorting/pagination
│   │   └── api/                   # API endpoints
│   │
│   ├── styles/                    # Global styles
│   │
│   └── utils/                     # Utilities
│       ├── helpers.js             # Formatting, CSV export
│       └── validation.js          # Validation schemas
│
├── INFRASTRUCTURE.txt             # Architecture documentation
├── README.md                      # This file
└── package.json
```

---

## Testing Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Browser**: Navigate to http://localhost:3000

4. **Test Dashboard**:
   - View statistics, charts, and metrics
   - Toggle dark/light mode
   - Use quick action buttons
   - Export inventory data to CSV

5. **Test Transfers**:
   - Navigate to /transfers
   - Create a transfer between warehouses
   - Verify stock levels update correctly
   - View transfer history and details
   - Filter and search transfers

6. **Test Alerts**:
   - Navigate to /alerts
   - View products by status tabs
   - Acknowledge/dismiss alerts
   - Check reorder recommendations
   - Click "Create Transfer" from alert

7. **Test CRUD Operations**:
   - Add/edit/delete products
   - Add/edit/delete warehouses
   - Add/edit/delete stock records
   - Verify referential integrity (try deleting product with stock)

8. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | List all products |
| POST | /api/products | Create product |
| GET | /api/products/:id | Get product |
| PUT | /api/products/:id | Update product |
| DELETE | /api/products/:id | Delete product (cascade=true optional) |
| GET | /api/warehouses | List all warehouses |
| POST | /api/warehouses | Create warehouse |
| GET | /api/warehouses/:id | Get warehouse |
| PUT | /api/warehouses/:id | Update warehouse |
| DELETE | /api/warehouses/:id | Delete warehouse (cascade=true optional) |
| GET | /api/stock | List all stock records |
| POST | /api/stock | Create stock record |
| GET | /api/stock/:id | Get stock record |
| PUT | /api/stock/:id | Update stock record |
| DELETE | /api/stock/:id | Delete stock record |
| GET | /api/transfers | List all transfers |
| POST | /api/transfers | Create transfer |
| GET | /api/transfers/:id | Get transfer details |
| DELETE | /api/transfers/:id | Delete transfer |
| GET | /api/alerts | Get all alerts with summary |
| POST | /api/alerts | Acknowledge alert |

---

## Known Limitations

1. **No User Authentication**: System doesn't have login/authentication
2. **No Real-Time Updates**: Data doesn't auto-sync between browser tabs
3. **JSON File Storage**: Not suitable for production (needs database)
4. **No Undo for Transfers**: Completed transfers cannot be reversed
5. **Basic Search**: Text search only, no advanced filtering

---

## Future Enhancements

1. **Unit & Integration Tests**: Jest tests for API routes and components
2. **TypeScript Migration**: Full type safety throughout
3. **Real Database**: PostgreSQL or MongoDB for production
4. **User Authentication**: Role-based access control
5. **Batch Operations**: Transfer multiple products at once
6. **Automated Reordering**: Connect to supplier APIs
7. **Audit Trail**: Complete history logging
8. **Advanced Analytics**: Historical trends and forecasting

---

## Live Demo

**[https://inventory-management-assessment.vercel.app](https://inventory-management-assessment.vercel.app)**

Deployed on Vercel with automatic deployments from GitHub.

---

## Video Walkthrough

[To be added after recording]

---

## Submission Details

- **Developer**: Ulysses Puzon
- **Completion Time**: Within 72-hour deadline
- **All 3 Core Tasks**: Completed
- **Bonus Features**: Dark mode, CSV export, keyboard shortcuts, accessibility, responsive design

---

## Deployment & Version Control

- **Live Demo**: [https://inventory-management-assessment.vercel.app](https://inventory-management-assessment.vercel.app)
- **GitHub Repository**: [https://github.com/YlunoZup/inventory-management-assessment](https://github.com/YlunoZup/inventory-management-assessment)
- **Hosting**: Vercel (automatic deployments on push to main branch)
- **CI/CD**: GitHub → Vercel integration with automatic builds

---

**Built with** Next.js 15.5.9, Material-UI v6, React 18.3, Recharts 2.12.7

**Documentation**: See INFRASTRUCTURE.txt for complete architecture details
