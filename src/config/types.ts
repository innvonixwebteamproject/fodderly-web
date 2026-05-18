import { type LucideIcon } from "lucide-react";

export type AllowedRole = "admin" | "partner";

export interface MenuItem {
  title?: string;
  icon?: LucideIcon;
  path?: string;
  rootPath?: string;
  childrenIndex?: number;
  heading?: string;
  children?: MenuConfig;
  disabled?: boolean;
  collapse?: boolean;
  collapseTitle?: string;
  expandTitle?: string;
  badge?: string;
  separator?: boolean;
  showInMenu?: boolean;
  showInBreadcrumb?: boolean;
  isCustomComponent?: boolean;
  allowedRoles?: AllowedRole[];
}

export type MenuConfig = MenuItem[];
