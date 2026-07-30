export const createSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
};

export const createSearchableText = (values: readonly string[]): string => {
  return values
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .join(" ");
};
