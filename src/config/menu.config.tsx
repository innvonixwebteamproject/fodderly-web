import {
  LayoutDashboard,
  Handshake,
  Shapes,
  Warehouse,
  Package,
  Users,
  UserCheck,
  Settings,
  Map,
  Globe,
  Navigation,
  Home,
  BadgeCheck,
  Bell,
  ClipboardList,
  Ban,
} from "lucide-react";
import { type MenuConfig } from "./types";

/**
 * Sidebar menu configuration
 * Only active modules are listed here.
 */
export const MENU_SIDEBAR: MenuConfig = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin/dashboard",
    allowedRoles: ["admin"],
  },
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/partner/dashboard",
    allowedRoles: ["partner"],
  },
  {
    title: "Partners",
    icon: Handshake,
    path: "/admin/partners",
    allowedRoles: ["admin"],
  },
  {
    title: "Fodderman",
    icon: UserCheck,
    path: "/admin/fodderman",
    allowedRoles: ["admin"],
  },
  {
    title: "Fodderman",
    icon: UserCheck,
    path: "/partner/fodderman",
    allowedRoles: ["partner"],
  },
  {
    title: "Farmers",
    icon: Users,
    path: "/admin/farmers",
    allowedRoles: ["admin"],
  },
  {
    title: "Farmers",
    icon: Users,
    path: "/partner/farmers",
    allowedRoles: ["partner"],
  },
  {
    title: "Categories",
    icon: Shapes,
    path: "/admin/category-cms",
    allowedRoles: ["admin"],
  },
  {
    title: "Products",
    icon: Package,
    path: "/admin/products",
    allowedRoles: ["admin"],
  },
  {
    title: "Products",
    icon: Package,
    path: "/partner/products",
    allowedRoles: ["partner"],
  },
  {
    title: "Daily Orders",
    icon: ClipboardList,
    path: "/partner/orders",
    allowedRoles: ["partner"],
  },
  {
    title: "Notifications",
    icon: Bell,
    path: "/partner/notifications",
    allowedRoles: ["partner"],
  },
  {
    title: "Inventory",
    icon: Warehouse,
    path: "/admin/inventory",
    allowedRoles: ["admin"],
  },
  {
    title: "Notifications",
    icon: Bell,
    path: "/admin/notifications",
    allowedRoles: ["admin"],
  },
  {
    title: "Orders",
    icon: ClipboardList,
    allowedRoles: ["admin"],
    children: [
      {
        title: "All Orders",
        icon: ClipboardList,
        path: "/admin/orders",
        allowedRoles: ["admin"],
      },
      {
        title: "Cancel & Refund",
        icon: Ban,
        path: "/admin/orders/cancelled-refunds",
        allowedRoles: ["admin"],
      },
    ],
  },
  {
    title: "Master",
    icon: Settings,
    allowedRoles: ["admin"],
    children: [
      {
        title: "States",
        icon: Map,
        path: "/admin/master/states",
        allowedRoles: ["admin"],
      },
      {
        title: "Districts",
        icon: Globe,
        path: "/admin/master/districts",
        allowedRoles: ["admin"],
      },
      {
        title: "Talukas",
        icon: Navigation,
        path: "/admin/master/talukas",
        allowedRoles: ["admin"],
      },
      {
        title: "Villages",
        icon: Home,
        path: "/admin/master/villages",
        allowedRoles: ["admin"],
      },
      {
        title: "Brands",
        icon: BadgeCheck,
        path: "/admin/master/brands",
        allowedRoles: ["admin"],
      },
    ],
  },
];

export const MENU_ROOT: MenuConfig = [];
