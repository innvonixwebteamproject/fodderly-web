import { Fragment, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { MENU_SIDEBAR } from "@/config/menu.config";
import { MenuItem } from "@/config/types";
import { cn } from "@/lib/utils";
import { useMenu } from "@/hooks/use-menu";
import { Container } from "@/components/common/container";
import { NotificationBell } from "@/features/notifications";
import { useAuthStore } from "@/features/auth/store/auth.store";

function Toolbar({ children }: { children?: ReactNode }) {
  return (
    <div className="pb-5">
      <Container className="flex items-center justify-between flex-wrap gap-3">
        {children}
      </Container>
    </div>
  );
}

function ToolbarActions({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center flex-wrap gap-1.5 lg:gap-3.5">
      {children}
    </div>
  );
}

import { useToolbarStore } from "@/hooks/use-toolbar-store";

function ToolbarBreadcrumbs() {
  const { pathname } = useLocation();
  const { getBreadcrumb, isActive } = useMenu(pathname);
  const { extraBreadcrumbs } = useToolbarStore();

  let items: MenuItem[] = getBreadcrumb(MENU_SIDEBAR);

  // Dynamic breadcrumb mapping
  const EXTRA_BREADCRUMB_MAP: Record<string, string> = {
    add: "Add",
    edit: "Edit",
    details: "Details",
    allocations: "Product Allocations",
  };

  // Extract path parts
  const pathParts = pathname.split("/").filter(Boolean);

  // Get the base path from the last breadcrumb item
  const basePath = items.length > 0 && items[items.length - 1].path
    ? items[items.length - 1].path
    : "";
  const basePathParts = (basePath || "").split("/").filter(Boolean);

  // Find parts that are NOT in the base path (these are the dynamic segments)
  const dynamicParts = pathParts.filter((part, index) => {
    // Skip parts that are in the base path
    if (index < basePathParts.length && basePathParts[index] === part) {
      return false;
    }
    // Keep non-numeric parts (edit, add, details)
    return isNaN(Number(part));
  });

  // Check if any dynamic part matches our extra breadcrumb map
  const extraBreadcrumb = dynamicParts.find((part) => EXTRA_BREADCRUMB_MAP[part]);

  // If it matches add/edit/details -> add breadcrumb item
  if (extraBreadcrumb && EXTRA_BREADCRUMB_MAP[extraBreadcrumb]) {
    items = [
      ...items,
      {
        title: EXTRA_BREADCRUMB_MAP[extraBreadcrumb],
        path: "",
      },
    ];
  }

  // Add extra breadcrumbs from store if provided
  if (extraBreadcrumbs) {
    items = [...items, ...extraBreadcrumbs];
  }

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-1 font-medium text-lg text-mono hover:text-primary">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const active = item.path ? isActive(item.path) : false;

        const displayTitle = item.title;

        return (
          <Fragment key={index}>
            {/* Render clickable or plain title */}
            {item.path ? (
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-1 shrink-0",
                  active && isLast
                    ? "text-mono hover:text-primary"
                    : "text-secondary-foreground hover:text-primary"
                )}
              >
                {displayTitle}
              </Link>
            ) : (
              <span
                className={cn(
                  "shrink-0",
                  isLast ? "text-mono" : "text-secondary-foreground"
                )}
              >
                {displayTitle}
              </span>
            )}

            {/* Use > instead of / */}
            {!isLast && <span className="text-muted-foreground shrink-0">{">"}</span>}
          </Fragment>
        );
      })}
    </div>
  );
}

const ToolbarHeading = () => {
  const { actions } = useToolbarStore();
  const role = useAuthStore((state) => state.role);

  return (
    <div className="flex items-center justify-between flex-wrap gap-4 w-full">
      <div className="flex items-center gap-3 flex-wrap min-w-0">
        <ToolbarBreadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        {actions}
        {(role === "admin" || role === "partner") && <NotificationBell />}
      </div>
    </div>
  );
};

export { Toolbar, ToolbarActions, ToolbarBreadcrumbs, ToolbarHeading };
