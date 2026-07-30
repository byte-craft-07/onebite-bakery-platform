# Business Rules

# Business Rules

Delivery Radius

10 KM

Payments

COD

UPI

Pickup

Available

Delivery

Available

Authentication

Mobile OTP

Cart

Guest + Database Hybrid

Stock

Deduct only after successful order.

Custom Cake

Customer chooses preferred delivery date.

Admin confirms availability.

Customer

Can view all previous orders.

Can reorder.

Can review completed orders.

Can download invoices.

Can favorite products.

Branch

Single Branch

Architecture ready for Multi Branch.

---

# Delivery Rules

## Home Delivery Eligibility

Home delivery is available only when the customer's order total meets or exceeds the minimum order amount configured by the owner.

Example:

Minimum Home Delivery Amount: ₹300

Order Total < ₹300
→ Pickup Only

Order Total ≥ ₹300
→ Customer can choose:
- Home Delivery
- Store Pickup

The minimum order amount must be configurable from the Owner Dashboard.

The value must never be hardcoded.

---

# Product Types

The platform supports multiple product types.

1. NORMAL
   - Cakes
   - Pastries
   - Bread
   - Cookies
   - Brownies
   - Decoration Items

2. COMBO
   - Multiple products sold together as one package.

3. CUSTOM_CAKE
   - Customer-configured cakes.

Future product types may be added without changing the overall architecture.

---

# Combo Products

A combo is a sellable product that contains multiple existing products.

Examples:

Birthday Combo

Anniversary Combo

Baby Shower Combo

Festival Combo

Rules:

- Combo has its own selling price.
- Combo references existing products.
- Inventory is deducted from child products.
- Combo inventory is not maintained separately.

---

# Shop by Occasion

Customers can browse products by occasion.

Examples:

- Birthday
- Anniversary
- Baby Shower
- Wedding
- Valentine's Day
- Diwali
- Christmas

Each occasion can display:

- Cakes
- Combo Products
- Decoration Items
- Accessories
- Future Gift Products

One product may belong to multiple occasions.
