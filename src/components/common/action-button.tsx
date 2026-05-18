"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionIcon } from "@/config/icons.config";
import { cn } from "@/lib/utils";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
  TooltipProvider 
} from "@/components/ui/tooltip";

export type ActionButtonType = "view" | "edit" | "delete" | "add" | "save" | "cancel" | "search" | "close";

interface ActionButtonProps extends Omit<React.ComponentProps<typeof Button>, "variant" | "size"> {
  actionType: ActionButtonType;
  tooltip?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  showIconOnly?: boolean;
}

export function ActionButton({ 
  actionType, 
  tooltip, 
  className, 
  icon: CustomIcon,
  iconClassName,
  showIconOnly = true,
  children,
  ...props 
}: ActionButtonProps) {
  const { asChild = false, ...buttonProps } = props;

  const getIcon = () => {
    switch (actionType) {
      case "view": return ActionIcon.View;
      case "edit": return ActionIcon.Edit;
      case "delete": return ActionIcon.Delete;
      case "add": return ActionIcon.Add;
      case "save": return ActionIcon.Save;
      case "cancel": return ActionIcon.Cancel;
      case "close": return ActionIcon.Close;
      case "search": return ActionIcon.Search;
      default: return ActionIcon.View;
    }
  };

  const Icon = CustomIcon ?? getIcon();
  const defaultLabel = actionType.charAt(0).toUpperCase() + actionType.slice(1);
  const iconButtonBase =
    "border shadow-xs hover:shadow-sm hover:-translate-y-0.5";

  const actionVariants = {
    view: `${iconButtonBase} border-primary/20 bg-primary/10 text-primary hover:border-primary/20 hover:bg-primary/10 hover:text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-primary dark:hover:border-primary/30 dark:hover:bg-primary/15 dark:hover:text-primary`,
    edit: `${iconButtonBase} border-primary/20 bg-primary/10 text-primary hover:border-primary/20 hover:bg-primary/10 hover:text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-primary dark:hover:border-primary/30 dark:hover:bg-primary/15 dark:hover:text-primary`,
    delete: `${iconButtonBase} border-destructive/20 bg-destructive/10 text-destructive hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive dark:border-destructive/30 dark:bg-destructive/15 dark:text-destructive dark:hover:border-destructive/30 dark:hover:bg-destructive/15 dark:hover:text-destructive`,
    add: "bg-primary text-primary-foreground shadow-xs hover:-translate-y-0.5 hover:shadow-sm hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary",
    save: "bg-primary text-primary-foreground shadow-xs hover:-translate-y-0.5 hover:shadow-sm hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary",
    cancel: `${iconButtonBase} border-primary/20 bg-primary/10 text-primary hover:border-primary/20 hover:bg-primary/10 hover:text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-primary dark:hover:border-primary/30 dark:hover:bg-primary/15 dark:hover:text-primary`,
    close: `${iconButtonBase} border-primary/20 bg-primary/10 text-primary hover:border-primary/20 hover:bg-primary/10 hover:text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-primary dark:hover:border-primary/30 dark:hover:bg-primary/15 dark:hover:text-primary`,
    search: `${iconButtonBase} border-primary/20 bg-primary/10 text-primary hover:border-primary/20 hover:bg-primary/10 hover:text-primary dark:border-primary/30 dark:bg-primary/15 dark:text-primary dark:hover:border-primary/30 dark:hover:bg-primary/15 dark:hover:text-primary`,
  };

  const iconNode = (
    <Icon
      className={cn(
        "h-4 w-4 shrink-0 opacity-100",
        !showIconOnly && "mr-2",
        iconClassName,
      )}
    />
  );

  const slottedChild = asChild
    ? (React.Children.only(children) as React.ReactElement<{ children?: React.ReactNode }>)
    : null;

  const buttonChildren =
    asChild && React.isValidElement(slottedChild)
      ? React.cloneElement(
          slottedChild,
          undefined,
          showIconOnly ? (
            iconNode
          ) : (
            <>
              {iconNode}
              {slottedChild.props.children ?? defaultLabel}
            </>
          ),
        )
      : showIconOnly ? (
          iconNode
        ) : (
          <>
            {iconNode}
            {children || defaultLabel}
          </>
        );

  const buttonContent = (
    <Button
      asChild={asChild}
      variant={actionType === "save" || actionType === "add" ? "primary" : "ghost"}
      size={showIconOnly ? "icon" : "md"}
      mode={showIconOnly ? "icon" : "default"}
      className={cn(
        "transition-all duration-200",
        showIconOnly && "h-8 w-8 rounded-full",
        actionVariants[actionType],
        className
      )}
      {...buttonProps}
    >
      {buttonChildren}
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return buttonContent;
}
