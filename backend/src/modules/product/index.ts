export { ProductController } from "./controller/index.js";
export {
  PRODUCT_RESPONSE_MESSAGES,
  PRODUCT_TYPES,
  STOCK_STATUSES,
} from "./constants/index.js";
export type { ProductType, StockStatus } from "./constants/index.js";
export type {
  ComboItemDto,
  CreateProductDto,
  UpdateAvailabilityDto,
  UpdateInventoryDto,
  UpdatePricingDto,
  UpdateProductDto,
} from "./dto/index.js";
export { ProductModel } from "./model/index.js";
export type { ComboItem, Product } from "./model/index.js";
export { InventoryRepository, ProductRepository } from "./repository/index.js";
export { productRouter } from "./routes/index.js";
export { ProductService } from "./service/index.js";
export type {
  PaginatedResult,
  ProductInventoryResponse,
  ProductResponse,
  ProductSortOption,
  PublicProductQueryDto,
} from "./types/index.js";
export { calculateStockStatus } from "./utils/index.js";
export {
  createProductSchema,
  productIdParamSchema,
  productSlugParamSchema,
  publicProductQuerySchema,
  updateAvailabilitySchema,
  updateInventorySchema,
  updatePricingSchema,
  updateProductSchema,
} from "./validators/index.js";
