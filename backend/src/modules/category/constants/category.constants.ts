export const CATEGORY_RESPONSE_MESSAGES = {
  CREATED: "Category created successfully.",
  UPDATED: "Category updated successfully.",
  DELETED: "Category deleted successfully.",
  RESTORED: "Category restored successfully.",
  FETCHED: "Category fetched successfully.",
  LISTED: "Categories fetched successfully.",
  REORDERED: "Categories reordered successfully.",
} as const;

export const CATEGORY_ERROR_MESSAGES = {
  NOT_FOUND: "Category not found.",
  NAME_CONFLICT: "Category name already exists.",
  SLUG_CONFLICT: "Category slug already exists.",
  CIRCULAR_PARENT: "Category parent relationship cannot be circular.",
  HAS_CHILDREN: "Category has child categories and cannot be deleted.",
  INVALID_PARENT: "Parent category is invalid.",
} as const;
