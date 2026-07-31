# 44 — Page Wireframe & Layout Blueprints

## 1. Customer Pages

### 1.1 Home / Landing Page
- **Hero Banner**: Warm visual showcase with headline, CTA ("Explore Fresh Cakes"), and delivery location picker.
- **Categories Bar**: Scrollable horizontal list of category cards (Cakes, Pastries, Artisanal Breads, Combos).
- **Featured Bestsellers**: 4-column product grid with Quick Add triggers.
- **Custom Cake Showcase**: Interactive banner linking to Custom Cake Builder.
- **Customer Reviews & Store Info**: Ratings carousel and store address/pickup details.

### 1.2 Product Catalog Page
- **Header**: Search bar, selected category/occasion banner, active filters summary.
- **Sidebar (Left on Desktop, Drawer on Mobile)**: Categories, Occasions, Price Range slider, Eggless filter toggle.
- **Main Grid**: Sorted product list with pagination controls and skeleton loading.

### 1.3 Checkout Page
- **Step 1**: Delivery Option (Home Delivery vs Store Pickup).
- **Step 2**: Delivery Address Selector / Form (validates minimum threshold ₹300).
- **Step 3**: Order Review & Price Summary (Subtotal, Delivery Fee, Taxes, Total).
- **Step 4**: Payment Gateway Integration Trigger (Razorpay modal).

---

## 2. Admin Management Pages

### 2.1 Admin Dashboard
- **Key Metrics Row**: Total Sales, Active Orders, Low Stock Alerts, Revenue.
- **Recent Orders Table**: Real-time status badges (`PENDING`, `CONFIRMED`, `PREPARING`), quick status action dropdown.

### 2.2 Admin Product Management
- **Product Table**: Search by SKU/Name, Filter by Category, Inline Stock Status Toggle (`In Stock` / `Out of Stock`).
- **Create/Edit Drawer**: Product form with title, pricing, variant configurations, media upload dropzone, and eggless toggle.
