# API

# API DESIGN

Version

/api/v1

Response Format

Success

{
  "success": true,
  "message": "Success",
  "data": {}
}

Error

{
  "success": false,
  "message": "Something went wrong",
  "errors": []
}

--------------------------------------------------

# AUTH

POST    /auth/send-otp

POST    /auth/verify-otp

POST    /auth/refresh

POST    /auth/logout

POST    /auth/logout-all

GET     /auth/me

--------------------------------------------------

# PRODUCTS

GET     /products

GET     /products/:slug

GET     /products/admin

GET     /products/admin/:id

GET     /products/admin/:id/inventory

POST    /products

PATCH   /products/:id

PATCH   /products/:id/pricing

PATCH   /products/:id/inventory

PATCH   /products/:id/availability

DELETE  /products/:id

PATCH   /products/:id/restore

GET     /products/search

GET     /products/best-sellers

GET     /products/new-arrivals

GET     /products/seasonal

Public product responses expose price, compare-at price, stock status, and availability.

Public product responses must never expose cost price, stock quantity, low-stock threshold, inventory tracking rules, or backorder rules.

--------------------------------------------------

# CATEGORIES

GET     /categories

GET     /categories/admin

GET     /categories/:id

POST    /categories

PATCH   /categories/:id

DELETE  /categories/:id

PATCH   /categories/:id/restore

PATCH   /categories/reorder

--------------------------------------------------

# OCCASIONS

GET     /occasions

GET     /occasions/:slug

GET     /occasions/:slug/products

POST    /occasions

PUT     /occasions/:id

DELETE  /occasions/:id

--------------------------------------------------

# CART

GET

POST Add Product

PATCH Quantity

DELETE Remove Item

DELETE Clear Cart

POST Merge Guest Cart

--------------------------------------------------

# CHECKOUT

POST Checkout

POST Validate Order

GET Delivery Charge

--------------------------------------------------

# ORDERS

POST Place Order

GET My Orders

GET Order Details

PATCH Cancel Order

GET Invoice

--------------------------------------------------

# CUSTOM CAKE

POST Create

GET Details

PATCH Update

DELETE Cancel

--------------------------------------------------

# REVIEW

POST Review

GET Product Reviews

PATCH Edit

DELETE Remove

--------------------------------------------------

# FAVORITES

GET

POST

DELETE

--------------------------------------------------

# ADDRESS

GET

POST

PATCH

DELETE

--------------------------------------------------

# NOTIFICATIONS

GET

PATCH Mark Read

PATCH Mark All Read

--------------------------------------------------

# SETTINGS

GET Public Settings

--------------------------------------------------

============================

ADMIN

============================

Dashboard

GET Dashboard Summary

--------------------------------

Orders

GET All Orders

GET Order Details

PATCH Update Status

DELETE Cancel

--------------------------------

Products

POST

PATCH

DELETE

--------------------------------

Categories

POST

PATCH

DELETE

--------------------------------

Customers

GET List

GET Customer Details

--------------------------------

Reviews

GET

DELETE

--------------------------------

Coupons

GET

POST

PATCH

DELETE

--------------------------------

Banners

GET

POST

PATCH

DELETE

--------------------------------

Reports

Sales

Orders

Customers

Products

--------------------------------

Settings

GET

PATCH
