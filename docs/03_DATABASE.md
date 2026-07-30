# Database

# 03_DATABASE.md

## Database

MongoDB + Mongoose + TypeScript

---

# Collections Overview

* users
* addresses
* otps
* refreshTokens
* branches
* categories
* products
* productVariants
* productImages
* carts
* orders
* orderItems
* customCakeOrders
* reviews
* favorites
* notifications
* settings
* banners
* coupons
* deliveryBoys

---

# 1. users

Purpose: Customer and Admin accounts

| Field        | Type     | Required | Notes           |
| ------------ | -------- | -------- | --------------- |
| _id          | ObjectId | Yes      | Primary key     |
| name         | String   | Yes      | Customer name   |
| phone        | String   | Yes      | Unique          |
| email        | String   | No       | Optional        |
| role         | String   | Yes      | customer/admin  |
| isVerified   | Boolean  | Yes      | OTP verified    |
| profileImage | String   | No       | Cloudinary URL  |
| status       | String   | Yes      | active/blocked  |
| lastLogin    | Date     | No       | Last login time |
| createdAt    | Date     | Yes      | Auto            |
| updatedAt    | Date     | Yes      | Auto            |

Indexes:

* phone (unique)
* role
* status

Implementation Notes:

* `phone` unique index supports OTP login and prevents duplicate customer accounts.
* `role + status` index supports future admin/customer filtering.
* OTP values are never stored on the user document.

---

# 2. addresses

Purpose: Multiple customer addresses

| Field     | Type     |
| --------- | -------- |
| userId    | ObjectId |
| fullName  | String   |
| phone     | String   |
| address   | String   |
| landmark  | String   |
| city      | String   |
| state     | String   |
| pincode   | String   |
| location  | GeoJSON  |
| isDefault | Boolean  |

Indexes:

* userId
* location (2dsphere)

Implementation Notes:

* `userId` index supports customer saved-address lists.
* `location` 2dsphere index supports delivery-radius checks.
* `userId + isDefault` index supports fast default-address lookup.

---

# 2A. otps

Purpose: Temporary OTP verification challenges

| Field       | Type   | Notes                |
| ----------- | ------ | -------------------- |
| phone       | String | Customer/admin phone |
| purpose     | String | login/admin_login    |
| otpHash     | String | Stored hashed only   |
| expiresAt   | Date   | TTL cleanup          |
| attempts    | Number | Verification tries   |
| resendCount | Number | Resend tracking      |
| lastSentAt  | Date   | Rate-limit support   |
| isUsed      | Boolean| Prevent reuse        |
| ipAddress   | String | Security context     |
| userAgent   | String | Security context     |

Indexes:

* phone + purpose + createdAt
* expiresAt (TTL)

Implementation Notes:

* Raw OTP values must never be stored.
* TTL index automatically removes expired OTP challenges.
* This model does not send OTPs; sending belongs to the authentication service.

---

# 2B. refreshTokens

Purpose: Refresh-token session tracking

| Field             | Type     | Notes              |
| ----------------- | -------- | ------------------ |
| userId            | ObjectId | User reference     |
| tokenHash         | String   | Stored hashed only |
| expiresAt         | Date     | TTL cleanup        |
| revokedAt         | Date     | Logout/revoke      |
| replacedByTokenId | ObjectId | Rotation support   |
| ipAddress         | String   | Security context   |
| userAgent         | String   | Security context   |

Indexes:

* tokenHash (unique)
* userId + expiresAt
* expiresAt (TTL)

Implementation Notes:

* Raw refresh tokens must never be stored.
* Token rotation and revocation will be implemented in the authentication module.

---

# 3. branches

Purpose: Future multi-branch support

| Field    | Type    |
| -------- | ------- |
| name     | String  |
| address  | String  |
| phone    | String  |
| location | GeoJSON |
| status   | String  |

Indexes:

* location (2dsphere)
* status

---

# 4. categories

| Field        | Type   |
| ------------ | ------ |
| name         | String |
| slug         | String |
| image        | String |
| description  | String |
| displayOrder | Number |
| isActive     | Boolean |
| parentCategory | ObjectId |
| seoTitle | String |
| seoDescription | String |
| seoKeywords | String[] |
| searchableText | String |
| createdBy | ObjectId |
| updatedBy | ObjectId |
| isDeleted | Boolean |

Indexes:

* slug (unique)
* parentCategory
* displayOrder
* isActive + isDeleted

Implementation Notes:

* Categories support nested hierarchy for navigation and future product grouping.
* Public category APIs only expose active, non-deleted categories.
* SEO metadata is stored on the category document for canonical category pages.
* `searchableText` prepares category data for the future Search module.

---

# 5. occasions

| Field        | Type     |
| ------------ | -------- |
| name         | String   |
| slug         | String   |
| description  | String   |
| bannerImage  | String   |
| icon         | String   |
| displayOrder | Number   |
| isActive     | Boolean  |
| seoTitle     | String   |
| seoDescription | String |
| seoKeywords  | String[] |
| createdAt    | Date     |
| updatedAt    | Date     |

Indexes:

* slug (unique)
* displayOrder
* isActive

Implementation Notes:

* Occasions are independent from categories.
* A product may belong to multiple occasions.
* Occasion management will be owner-manageable in a future module.

---

# 6. products

| Field            | Type     |
| ---------------- | -------- |
| categoryId       | ObjectId |
| branchId         | ObjectId |
| name             | String   |
| slug             | String   |
| shortDescription | String   |
| description      | String   |
| isCustomizable   | Boolean  |
| productType      | String   |
| occasionIds      | ObjectId[] |
| comboItems       | Object[] |
| deliveryEligible | Boolean  |
| tags             | String[] |
| status           | String   |

Product Type Values:

* NORMAL
* COMBO
* CUSTOM_CAKE

Combo Item Fields:

* productId
* quantity

Indexes:

* slug (unique)
* categoryId
* branchId
* productType
* occasionIds
* status
* name (text)

Implementation Notes:

* Decoration items use the same Product architecture as bakery items.
* Combo products are first-class products and reference child products through `comboItems`.
* Combo inventory is deducted from child products during future checkout logic.
* Product-level `deliveryEligible` prepares checkout delivery decisions.

---

# 7. productVariants

Purpose: Weight/flavor/egg variants

| Field         | Type     |
| ------------- | -------- |
| productId     | ObjectId |
| weight        | String   |
| flavor        | String   |
| eggType       | String   |
| price         | Number   |
| discountPrice | Number   |
| stock         | Number   |
| sku           | String   |
| status        | String   |

Indexes:

* productId
* sku (unique)
* stock

---

# 8. productImages

| Field        | Type     |
| ------------ | -------- |
| productId    | ObjectId |
| imageUrl     | String   |
| displayOrder | Number   |
| isPrimary    | Boolean  |

Indexes:

* productId
* displayOrder

---

# 8. carts

Purpose: Logged-in user cart

| Field     | Type     |
| --------- | -------- |
| userId    | ObjectId |
| items     | Array    |
| updatedAt | Date     |

Cart Item:

* variantId
* quantity

Indexes:

* userId (unique)

---

# 9. orders

| Field          | Type     |
| -------------- | -------- |
| orderNumber    | String   |
| customerId     | ObjectId |
| addressId      | ObjectId |
| branchId       | ObjectId |
| paymentMethod  | String   |
| paymentStatus  | String   |
| orderStatus    | String   |
| deliveryType   | String   |
| subtotal       | Number   |
| deliveryCharge | Number   |
| discount       | Number   |
| grandTotal     | Number   |
| notes          | String   |

Indexes:

* orderNumber (unique)
* customerId
* orderStatus
* createdAt

Order Status:

* pending
* accepted
* preparing
* ready_for_pickup
* out_for_delivery
* delivered
* cancelled

Payment Status:

* pending
* paid
* failed

Delivery Type:

* delivery
* pickup

---

# 10. orderItems

| Field     | Type     |
| --------- | -------- |
| orderId   | ObjectId |
| variantId | ObjectId |
| quantity  | Number   |
| price     | Number   |

Indexes:

* orderId
* variantId

---

# 11. customCakeOrders

| Field               | Type     |
| ------------------- | -------- |
| orderId             | ObjectId |
| shape               | String   |
| weight              | String   |
| flavor              | String   |
| cream               | String   |
| eggType             | String   |
| message             | String   |
| referenceImage      | String   |
| deliveryDate        | Date     |
| deliveryTime        | String   |
| specialInstructions | String   |

Indexes:

* orderId
* deliveryDate

---

# 12. reviews

| Field     | Type     |
| --------- | -------- |
| userId    | ObjectId |
| productId | ObjectId |
| rating    | Number   |
| comment   | String   |
| images    | String[] |
| status    | String   |

Indexes:

* productId
* userId
* rating

---

# 13. favorites

| Field     | Type     |
| --------- | -------- |
| userId    | ObjectId |
| productId | ObjectId |

Indexes:

* userId + productId (unique)

---

# 14. notifications

| Field   | Type     |
| ------- | -------- |
| userId  | ObjectId |
| title   | String   |
| message | String   |
| isRead  | Boolean  |

Indexes:

* userId
* isRead
* createdAt

---

# 15. settings

Single document collection

| Field          | Type   |
| -------------- | ------ |
| bakeryName     | String |
| logo           | String |
| phone          | String |
| whatsapp       | String |
| address        | String |
| storeTiming    | Object |
| deliveryRadius | Number |
| deliveryCharge | Number |
| delivery.minimumHomeDeliveryAmount | Number |
| delivery.homeDeliveryEnabled | Boolean |
| delivery.pickupEnabled | Boolean |
| upiQr          | String |
| upiId          | String |
| socialLinks    | Object |

Indexes:

* singletonKey (unique)

Implementation Notes:

* `singletonKey` unique index enforces one settings document.
* Settings includes service toggles for delivery, pickup, COD, and UPI.
* Delivery settings include the configurable minimum home delivery amount.
* Business values should come from settings instead of hardcoded code.

---

# 16. banners

| Field        | Type   |
| ------------ | ------ |
| title        | String |
| image        | String |
| link         | String |
| displayOrder | Number |
| status       | String |

Indexes:

* displayOrder
* status

---

# 17. coupons

| Field          | Type   |
| -------------- | ------ |
| code           | String |
| type           | String |
| value          | Number |
| minOrderAmount | Number |
| expiryDate     | Date   |
| usageLimit     | Number |
| usedCount      | Number |
| status         | String |

Indexes:

* code (unique)
* expiryDate
* status

---

# 18. deliveryBoys

| Field         | Type   |
| ------------- | ------ |
| name          | String |
| phone         | String |
| vehicleNumber | String |
| status        | String |

Indexes:

* phone (unique)
* status

---

# Relationships

users → orders (1:N)

users → reviews (1:N)

users → favorites (1:N)

users → addresses (1:N)

categories → products (1:N)

products → productVariants (1:N)

products → productImages (1:N)

orders → orderItems (1:N)

orders → customCakeOrders (1:1)

branches → products (1:N)

branches → orders (1:N)

---

# Inventory Rule

Stock is deducted only after successful order creation.

No stock reservation on Add to Cart.

---

# Cart Strategy

Guest User → localStorage

Logged-in User → MongoDB

Auto merge after OTP login.

---

# Future Ready Notes

The schema is designed to support:

* Multiple branches
* Multiple delivery zones
* Online payment gateway
* Loyalty points
* Subscription cakes
* Restaurant/cafe module
* Mobile app

---

# Database Foundation Contract

All models must:

* use Mongoose + TypeScript interfaces
* enable timestamps
* declare named indexes in the model file
* include comments explaining why each index exists
* keep schema logic inside models only
* keep database queries inside repositories only

Base repository provides reusable methods:

* create
* findById
* findOne
* findMany
* update
* softDelete
* restore

Models created in the database foundation:

* User
* Address
* OTP
* RefreshToken
* Settings

No feature logic is implemented in the database foundation.
