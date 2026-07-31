import type { SearchQueryDto } from "../dto/index.js";
import {
  MongoSearchProvider,
  type SearchProvider,
  type SearchResultResponse,
} from "../providers/index.js";

export class SearchService {
  private readonly searchProvider: SearchProvider;

  public constructor(searchProvider?: SearchProvider) {
    this.searchProvider = searchProvider ?? new MongoSearchProvider();
  }

  public async executeSearch(
    dto: SearchQueryDto,
  ): Promise<SearchResultResponse> {
    const queryText = dto.query ?? dto.q ?? "";

    return this.searchProvider.search({
      ...dto,
      query: queryText,
    });
  }
}
