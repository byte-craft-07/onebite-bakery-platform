export interface AdminNavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  badge?: string;
  isDisabled?: boolean;
}

export interface AdminStatItem {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  iconName: string;
}
