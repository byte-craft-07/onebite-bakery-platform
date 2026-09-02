# 36 — Component Library Specification

## 1. Overview

The The Online Bakery Component Library defines modular, reusable React UI components built with TailwindCSS / Vanilla CSS tokens and Radix UI primitives for accessibility.

---

## 2. Core Control Components

### 2.1 Buttons
- **Variants**: `Primary` (Solid Caramel), `Secondary` (Outline Espresso), `Ghost` (Transparent hover), `Danger` (Rose Red), `Link`.
- **Sizes**: `sm` (36px), `md` (44px), `lg` (52px).
- **States**: Default, Hover, Active/Focus, Loading (with embedded Spinner), Disabled.

### 2.2 Form Controls
- **Input / Textarea**: Floating or top-aligned labels, error states with helper text, optional prefix/suffix icons.
- **Select / Combobox**: Searchable dropdowns for categories, occasions, and delivery slots.
- **Checkbox / Radio / Switch**: Customized accessible controls with smooth amber accent fills.

---

## 3. Feedback & Data Display

### 3.1 Badges & Chips
- **Badges**: Stock Status (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`), Product Tags (`BESTSELLER`, `EGGLESS`, `NEW`).
- **Chips**: Filter selection chips with dismissive (`x`) triggers.

### 3.2 Alerts, Toasts & Modals
- **Alert**: Inline notification boxes for cart threshold warnings or delivery notices.
- **Toast**: Floating notification toasts for "Item added to cart", "Address saved", etc.
- **Modal / Drawer**: Accessible dialog overlays for quick view, custom cake config, and address forms.

---

## 4. E-Commerce Domain Cards

### 4.1 ProductCard
- Displays product image, title, price, compareAtPrice, rating, egg preference badge, and Quick Add button.

### 4.2 ComboCard & CustomCakeCard
- Custom cards highlighting combo item savings or custom cake configuration preview.

---

## 5. Navigation & Layout Components

- **Navbar**: Sticky glassmorphism header with logo, search bar, category navigation links, user profile menu, and live cart drawer badge trigger.
- **Footer**: Multi-column links, newsletter signup, store location, social links, and payment trust badges.
- **Breadcrumbs**: Hierarchical route trail (`Home > Products > Cakes > Chocolate Truffle`).
- **Pagination & Skeletons**: Accessible pagination controls and shimmer skeleton loaders during API fetches.
