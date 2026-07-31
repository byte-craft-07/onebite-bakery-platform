export { SearchController } from "./controller/index.js";
export type { SearchQueryDto } from "./dto/index.js";
export {
  MongoSearchProvider,
  escapeRegex,
  type SearchProvider,
} from "./providers/index.js";
export { searchRouter } from "./routes/index.js";
export { SearchService } from "./service/index.js";
export type {
  MatchedCategoryItem,
  MatchedOccasionItem,
  SearchResultResponse,
} from "./types/index.js";
export { searchQuerySchema } from "./validators/index.js";
