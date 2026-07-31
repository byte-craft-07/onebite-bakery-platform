import type { Request, Response } from "express";

import { sendSuccess } from "../../../shared/responses/api-response.js";
import type { SearchQueryDto } from "../dto/index.js";
import type { SearchService } from "../service/index.js";

export class SearchController {
  public constructor(private readonly searchService: SearchService) {}

  public search = async (
    request: Request,
    response: Response,
  ): Promise<Response> => {
    const query = request.query as unknown as SearchQueryDto & { q?: string };
    const searchDto: SearchQueryDto = {
      ...query,
      query: query.query ?? query.q ?? "",
    };

    const result = await this.searchService.executeSearch(searchDto);

    return sendSuccess(response, {
      message: "Search results fetched successfully.",
      data: result,
    });
  };
}
