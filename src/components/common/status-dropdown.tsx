import { ReactNode, useState } from "react";
import { Check, ChevronDown, Circle, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Generic types for the component
export interface StatusConfig {
  label: string;
  variant:
    | "success"
    | "warning"
    | "secondary"
    | "destructive"
    | "primary"
    | "info";
  color: string;
  bgColor: string;
  borderColor: string;
  icon?: ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BaseEntity<TStatus = any> {
  id: string;
  clientName?: string;
  name?: string;
  status: TStatus;
}

export interface StatusDropdownProps<
  T extends BaseEntity<TStatus>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TStatus = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TExtraData = any,
> {
  entity: T;
  currentStatus: TStatus;
  availableStatuses?: TStatus[];
  getStatusConfig: (status: TStatus) => StatusConfig;
  entityType?: string;
  disabled?: boolean;
  readOnly?: boolean;
  showConfirmation?: boolean;
  confirmationTitle?: string;
  getConfirmationMessage?: (
    entity: T,
    newStatus: TStatus,
    statusConfig: StatusConfig,
  ) => string;
  renderAdditionalConfirmation?: (
    newStatus: TStatus,
    currentData: TExtraData,
    onDataChange: (data: TExtraData) => void,
  ) => ReactNode;
  isConfirmDisabled?: (
    newStatus: TStatus,
    additionalData: TExtraData | undefined,
  ) => boolean;
  onSameStatusSelected?: (status: TStatus) => void;
  onStatusChange?: (
    entity: T,
    newStatus: TStatus,
    additionalData?: TExtraData,
  ) => Promise<void>;
}

export const StatusDropdown = <
  T extends BaseEntity<TStatus>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TStatus = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TExtraData = any,
>({
  entity,
  currentStatus,
  availableStatuses = [],
  getStatusConfig,
  onStatusChange,
  entityType = "item",
  disabled = false,
  readOnly = false,
  showConfirmation = true,
  confirmationTitle = "Confirm Status Change",
  getConfirmationMessage,
  renderAdditionalConfirmation,
  isConfirmDisabled,
  onSameStatusSelected,
}: StatusDropdownProps<T, TStatus, TExtraData>) => {
  const [isChanging, setIsChanging] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<TStatus | null>(null);
  const [additionalData, setAdditionalData] = useState<TExtraData | undefined>(
    undefined,
  );

  const currentConfig = getStatusConfig(currentStatus);

  const handleStatusClick = (newStatus: TStatus) => {
    if (newStatus === currentStatus) {
      onSameStatusSelected?.(newStatus);
      return;
    }

    if (disabled || readOnly || !onStatusChange)
      return;

    setPendingStatus(newStatus);

    if (showConfirmation) {
      setShowConfirmDialog(true);
    } else {
      confirmStatusChange();
    }
  };

  const confirmStatusChange = async () => {
    if (pendingStatus === null || !onStatusChange) return;

    setIsChanging(true);
    setShowConfirmDialog(false);

    try {
      await onStatusChange(entity, pendingStatus, additionalData);
    } catch (error) {
      console.error(`Error changing ${entityType} status:`, error);
    } finally {
      setIsChanging(false);
      setPendingStatus(null);
    }
  };

  const cancelStatusChange = () => {
    setShowConfirmDialog(false);
    setPendingStatus(null);
    setAdditionalData(undefined);
  };

  const getDefaultConfirmationMessage = () => {
    const newStatusConfig =
      pendingStatus !== null ? getStatusConfig(pendingStatus) : null;
    if (!newStatusConfig) return "";

    if (getConfirmationMessage) {
      return getConfirmationMessage(entity, pendingStatus!, newStatusConfig);
    }

    const entityName = entity.clientName || entity.name || "this item";
    return (
      <div className="flex flex-col gap-1">
        <span>Are you sure you want to change status of </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block max-w-full cursor-help align-top">
                <strong className="block overflow-hidden break-all text-left font-semibold text-foreground" style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}>
                  {entityName}
                </strong>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" sideOffset={6} className="max-w-xs break-all">
              <p>{entityName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span>to <span className="font-medium lowercase">{newStatusConfig.label}</span>?</span>
      </div>
    );
  };

  const defaultIcon = <Circle className="h-2 w-2 fill-current" />;

  if (readOnly) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded-full border w-fit min-w-[82px] justify-center",
          currentConfig.bgColor,
          currentConfig.borderColor,
        )}
      >
        <div className={cn("flex items-center", currentConfig.color)}>
          {currentConfig.icon || defaultIcon}
        </div>
        <span className={cn("text-[11px] font-semibold", currentConfig.color)}>
          {currentConfig.label}
        </span>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent h-auto"
            disabled={isChanging || disabled}
          >
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-0.75 rounded-full border transition-all",
                currentConfig.bgColor,
                currentConfig.borderColor,
                "hover:shadow-sm cursor-pointer group min-w-[82px] justify-center",
                (disabled || isChanging) && "opacity-50 cursor-not-allowed",
              )}
            >
              {isChanging ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <div className={cn("flex items-center", currentConfig.color)}>
                  {currentConfig.icon || defaultIcon}
                </div>
              )}
              <span className={cn("text-[11px] font-semibold", currentConfig.color)}>
                {currentConfig.label}
              </span>
              {!disabled && (
                <ChevronDown
                  className={cn(
                    "h-3 w-3 shrink-0 transition-transform group-hover:translate-y-0.5",
                    currentConfig.color,
                  )}
                />
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="min-w-[122px]">
          <div className="px-2 py-1">
            <p className="mb-0.5 text-[11px] font-medium text-muted-foreground">
              Change Status
            </p>
          </div>
          <DropdownMenuSeparator />

          {availableStatuses.map((status) => {
            const statusConfig = getStatusConfig(status);
            const isCurrentStatus = status === currentStatus;

            return (
              <DropdownMenuItem
                key={String(status)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusClick(status);
                }}
                disabled={isCurrentStatus && !onSameStatusSelected}
                className="cursor-pointer px-2 py-1.5"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <div className={statusConfig.color}>
                      {statusConfig.icon || defaultIcon}
                    </div>
                    <span className="text-[12px]">{statusConfig.label}</span>
                  </div>
                  {isCurrentStatus && (
                    <Check className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {showConfirmation && (
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmationTitle}</AlertDialogTitle>
              <AlertDialogDescription className="break-words">
                {getDefaultConfirmationMessage()}
                {!getConfirmationMessage && (
                  <>
                    <br />
                    <span className="text-xs text-muted-foreground mt-2 block">
                      This action will update the {entityType}'s status immediately.
                    </span>
                  </>
                )}
                {renderAdditionalConfirmation &&
                  pendingStatus !== null &&
                  renderAdditionalConfirmation(
                    pendingStatus,
                    additionalData as TExtraData,
                    setAdditionalData,
                  )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelStatusChange}>
                <CancelButtonContent />
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmStatusChange}
                disabled={
                  isConfirmDisabled
                    ? isConfirmDisabled(pendingStatus!, additionalData)
                    : false
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Confirm Change
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
