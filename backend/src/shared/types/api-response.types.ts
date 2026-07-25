export interface ApiSuccessResponse<TData> {
  success: true;
  message: string;
  data: TData;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: unknown[];
  code?: string;
}

export type ApiResponse<TData> =
  | ApiSuccessResponse<TData>
  | ApiErrorResponse;

export interface SendSuccessOptions<TData> {
  message?: string;
  data?: TData;
  statusCode?: number;
}

export interface SendErrorOptions {
  message: string;
  errors?: unknown[];
  statusCode?: number;
  code?: string;
}

