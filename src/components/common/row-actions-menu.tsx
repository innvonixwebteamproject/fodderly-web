"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { ActionIcon } from "@/config/icons.config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActionButton, type ActionButtonType } from "@/components/common/action-button";

export interface RowActionConfig {
  key?: string;
  label: string;
  actionType?: ActionButtonType;
  icon?: LucideIcon;
  onSelect?: () => void;
  disabled?: boolean;
  hidden?: boolean;
  variant?: "destructive";
  /** Wrap menu item around a child (e.g. `Link`) — label and icon are applied to the child. */
  asChild?: boolean;
  children?: React.ReactNode;
}

function resolveActionIcon(actionType: ActionButtonType | undefined, custom?: LucideIcon): LucideIcon {
  if (custom) return custom;
  switch (actionType) {
    case "view":
      return ActionIcon.View;
    case "edit":
      return ActionIcon.Edit;
    case "delete":
      return ActionIcon.Delete;
    case "add":
      return ActionIcon.Add;
    case "save":
      return ActionIcon.Save;
    case "cancel":
      return ActionIcon.Cancel;
    case "close":
      return ActionIcon.Close;
    case "search":
      return ActionIcon.Search;
    default:
      return ActionIcon.View;
  }
}

interface RowActionsMenuProps {
  items: RowActionConfig[];
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
  /**
   * Use only when this listing's action column defines a single action type (e.g. view-only).
   * Otherwise the three-dot menu is shown even when one action is visible for a row.
   */
  singleActionAsIcon?: boolean;
}

function renderSingleActionButton(item: RowActionConfig) {
  if (item.asChild && item.children) {
    return (
      <ActionButton
        actionType={item.actionType ?? "view"}
        icon={item.icon}
        tooltip={item.label}
        disabled={item.disabled}
        asChild
      >
        {item.children}
      </ActionButton>
    );
  }
  return (
    <ActionButton
      actionType={item.actionType ?? "view"}
      icon={item.icon}
      tooltip={item.label}
      onClick={item.onSelect}
      disabled={item.disabled}
    />
  );
}

function RowActionsDropdown({
  visibleItems,
  align,
  className,
  contentClassName,
}: {
  visibleItems: RowActionConfig[];
  align: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          mode="icon"
          className={cn(
            "h-8 w-8 shrink-0 rounded-full border border-border/80 bg-background text-muted-foreground shadow-xs transition-all hover:bg-muted/60 hover:text-foreground",
            className,
          )}
          aria-label="Row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn("min-w-[11rem]", contentClassName)}>
        {visibleItems.map((item, index) => {
          const Icon = resolveActionIcon(item.actionType, item.icon);
          const isDestructive = item.variant === "destructive" || item.actionType === "delete";
          const itemKey = item.key ?? item.label ?? String(index);

          if (item.asChild && React.isValidElement(item.children)) {
            return (
              <DropdownMenuItem
                key={itemKey}
                asChild
                variant={isDestructive ? "destructive" : undefined}
                disabled={item.disabled}
              >
                {React.cloneElement(
                  item.children as React.ReactElement<{ className?: string; children?: React.ReactNode }>,
                  {
                    className: cn(
                      "flex w-full cursor-pointer items-center gap-2 text-[13px]",
                      (item.children as React.ReactElement<{ className?: string }>).props.className,
                    ),
                    children: (
                      <>
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                        <span>{item.label}</span>
                      </>
                    ),
                  },
                )}
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem
              key={itemKey}
              variant={isDestructive ? "destructive" : undefined}
              disabled={item.disabled}
              className="text-[13px]"
              onSelect={() => {
                if (item.disabled) return;
                item.onSelect?.();
              }}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              <span>{item.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Row actions: three-dot menu by default (including when only one action is visible).
 * Pass `singleActionAsIcon` only for listings that never define more than one action type.
 */
export function RowActionsMenu({
  items,
  align = "end",
  className,
  contentClassName,
  singleActionAsIcon = false,
}: RowActionsMenuProps) {
  const visibleItems = React.useMemo(() => items.filter((item) => !item.hidden), [items]);

  if (visibleItems.length === 0) {
    return null;
  }

  if (singleActionAsIcon && visibleItems.length === 1) {
    return renderSingleActionButton(visibleItems[0]);
  }

  return (
    <RowActionsDropdown
      visibleItems={visibleItems}
      align={align}
      className={className}
      contentClassName={contentClassName}
    />
  );
}
