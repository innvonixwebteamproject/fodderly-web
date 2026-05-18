"use client";

import { JSX, useCallback, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  AccordionMenu,
  AccordionMenuClassNames,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuSub,
  AccordionMenuSubContent,
  AccordionMenuSubTrigger,
} from "@/components/ui/accordion-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { MENU_SIDEBAR } from "@/config/menu.config";
import { type MenuItem } from "@/config/types";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function SidebarMenuPrimary({ isOpen }: { isOpen: boolean }) {
  const { role } = useAuthStore();
  const { pathname } = useLocation();

  const filterMenuByRole = useCallback(
    (items: MenuItem[]): MenuItem[] => {
      return items
        .filter((item) => {
          if (!item.allowedRoles) return true;
          if (!role) return false;
          return item.allowedRoles.includes(role);
        })
        .map((item) => ({
          ...item,
          children: item.children ? filterMenuByRole(item.children) : undefined,
        }));
    },
    [role],
  );

  const filteredMenu = useMemo(() => filterMenuByRole(MENU_SIDEBAR), [filterMenuByRole]);

  const allPaths = useMemo(() => {
    const paths: string[] = [];
    const extract = (items: MenuItem[]) => {
      items.forEach((item) => {
        if (item.path) paths.push(item.path);
        if (item.children) extract(item.children);
      });
    };
    extract(filteredMenu);
    return paths;
  }, [filteredMenu]);

  const matchPath = useCallback(
    (path: string): boolean => {
      if (!path || !pathname) return false;
      if (path === pathname) return true;
      
      // If there's an exact match for another path, this prefix match should be false
      if (allPaths.some(p => p !== path && p === pathname)) return false;

      // Check if this path is a prefix and if there's no longer matching prefix in allPaths
      if (pathname.startsWith(path + "/")) {
        const hasBetterPrefix = allPaths.some(p => 
          p !== path && 
          p.length > path.length && 
          (pathname === p || pathname.startsWith(p + "/"))
        );
        return !hasBetterPrefix;
      }

      return false;
    },
    [pathname, allPaths],
  );

  const rootIconClass = "size-[1.1rem] shrink-0";

  const classNames: AccordionMenuClassNames = {
    root: "space-y-2.5 px-0",
    group: "gap-px",
    label:
      "uppercase text-xs font-medium text-muted-foreground/70 pt-2.25 pb-px",
    separator: "",
    item: cn(
      "hover:bg-transparent border border-transparent text-accent-foreground hover:text-mono data-[selected=true]:text-white data-[selected=true]:bg-primary data-[selected=true]:border-border data-[selected=true]:font-medium",
      "h-9 justify-center"
    ),
    sub: "",
    subTrigger: cn(
      "hover:bg-transparent border border-transparent text-accent-foreground hover:text-mono data-[selected=true]:text-white data-[selected=true]:bg-primary data-[selected=true]:border-border data-[selected=true]:font-medium",
      "h-9 justify-center"
    ),
    subContent: "py-0",
    indicator: "",
  };

  const buildMenu = (items: MenuItem[]): JSX.Element[] =>
    items.map((item: MenuItem, index: number) =>
      buildMenuItemRoot(item, index),
    );

  const buildMenuItemRoot = (item: MenuItem, index: number): JSX.Element => {
    if (item.children) {
      const hasVisibleChildren = item.children.length > 0;

      if (!hasVisibleChildren) {
        const iconNode = item.icon ? (
          <item.icon
            className={rootIconClass}
            data-slot="accordion-menu-icon"
          />
        ) : null;

        return (
          <AccordionMenuItem
            key={index}
            value={item.path || ""}
            className="text-sm font-medium"
          >
            <Link
              to={item.path || "#"}
              className={cn(
                "flex h-full items-center gap-2",
                !isOpen && "w-full justify-center",
              )}
            >
              {iconNode}
              {isOpen && (
                <span data-slot="accordion-menu-title">{item.title}</span>
              )}
            </Link>
          </AccordionMenuItem>
        );
      }

      // Collapsed sidebar: Use Popover for submenu
      if (!isOpen) {
        return (
          <CollapsedSubmenuItem key={index} item={item} matchPath={matchPath} />
        );
      }

      // Expanded sidebar: Use Accordion
      const subChildActive = item.children.some(
        (child) => child.path && matchPath(child.path),
      );
      const subParentPathActive = Boolean(item.path && matchPath(item.path));
      const subTriggerActive = subParentPathActive || subChildActive;

      return (
        <AccordionMenuSub key={index} value={item.path || `root-${index}`}>
          <AccordionMenuSubTrigger
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              subTriggerActive &&
                "border-border bg-primary font-medium text-white [&_svg]:opacity-100",
            )}
          >
            {item.icon && (
              <item.icon
                className={rootIconClass}
                data-slot="accordion-menu-icon"
              />
            )}
            {isOpen && (
              <span data-slot="accordion-menu-title">{item.title}</span>
            )}
          </AccordionMenuSubTrigger>

          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={item.path || `root-${index}`}
            className={cn("ps-6", !isOpen && "hidden")}
          >
            <AccordionMenuGroup>
              {buildMenuItemChildren(item.children, 1)}
            </AccordionMenuGroup>
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    }

    const iconNode = item.icon ? (
      <item.icon
        className={rootIconClass}
        data-slot="accordion-menu-icon"
      />
    ) : null;

    return (
      <AccordionMenuItem
        key={index}
        value={item.path || ""}
        className="text-sm font-medium"
      >
        <Link
          to={item.path || "#"}
          className={cn(
            "flex h-full items-center gap-2",
            !isOpen && "w-full justify-center",
          )}
        >
          {iconNode}
          {isOpen && <span data-slot="accordion-menu-title">{item.title}</span>}
        </Link>
      </AccordionMenuItem>
    );
  };

  const buildMenuItemChildren = (
    items: MenuItem[],
    level: number = 0,
  ): JSX.Element[] =>
    items.map((item: MenuItem, index: number) =>
      buildMenuItemChild(item, index, level),
    );

  const buildMenuItemChild = (
    item: MenuItem,
    index: number,
    level: number = 0,
  ): JSX.Element => {
    if (item.children) {
      return (
        <AccordionMenuSub
          key={index}
          value={item.path || `child-${level}-${index}`}
        >
          <AccordionMenuSubTrigger className="text-[13px]">
            {isOpen && item.title}
          </AccordionMenuSubTrigger>

          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={item.path || `child-${level}-${index}`}
            className={cn("ps-4", !isOpen && "hidden")}
          >
            <AccordionMenuGroup>
              {buildMenuItemChildren(item.children, level + 1)}
            </AccordionMenuGroup>
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    }

    return (
      <AccordionMenuItem
        key={index}
        value={item.path || ""}
        className="text-sm h-auto"
      >
        <Link to={item.path || "#"} className="flex h-full items-center gap-2">
          {item.icon && (
            <item.icon
              className="w-4 h-4"
              data-slot="accordion-menu-icon"
            />
          )}
          {isOpen && <span data-slot="accordion-menu-title">{item.title}</span>}
        </Link>
      </AccordionMenuItem>
    );
  };

  // Collapsed menu item with popover
  const CollapsedSubmenuItem = ({
    item,
    matchPath,
  }: {
    item: MenuItem;
    matchPath: (path: string) => boolean;
  }) => {
    const [open, setOpen] = useState(false);

    const isActive =
      Boolean(item.path && matchPath(item.path)) ||
      Boolean(
        item.children?.some((child) => child.path && matchPath(child.path)),
      );

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              "relative flex h-9 w-full cursor-pointer select-none items-center justify-center rounded-lg text-sm outline-hidden transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "border border-transparent",
              isActive
                ? "text-white bg-primary border-border font-medium"
                : "text-accent-foreground hover:text-mono",
              "data-[selected=true]:text-white data-[selected=true]:bg-primary data-[selected=true]:border-border data-[selected=true]:font-medium",
              "[&_svg]:opacity-60 data-[selected=true]:[&_svg]:opacity-100",
            )}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            data-selected={isActive ? "true" : undefined}
            data-slot="accordion-menu-item"
          >
            {item.icon && (
              <item.icon
                className="size-[1.2rem] flex-shrink-0"
                data-slot="accordion-menu-icon"
              />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          sideOffset={8}
          className="w-56 p-2 bg-card border-border"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="space-y-1">
            <div className="px-2 py-1.5 text-sm font-semibold text-foreground">
              {item.title}
            </div>
            {item.children?.map((child, idx) => {
              const isChildActive = child.path && matchPath(child.path);
              return (
                <Link
                  key={idx}
                  to={child.path || "#"}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isChildActive
                      ? "bg-primary text-white font-medium"
                      : "text-muted-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {child.icon && <child.icon className="w-4 h-4" />}
                  <span>{child.title}</span>
                </Link>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <AccordionMenu
      type="single"
      selectedValue={pathname}
      matchPath={matchPath}
      collapsible
      classNames={classNames}
    >
      <AccordionMenuGroup>{buildMenu(filteredMenu)}</AccordionMenuGroup>
    </AccordionMenu>
  );
}
