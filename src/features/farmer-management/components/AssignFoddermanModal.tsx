import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { IFarmer } from "../types/farmer.types";
import {
  useFoddermanOptionsQuery,
  usePatchFarmerMutation,
  useVillageOptionsQuery,
} from "../hooks";

interface AssignFoddermanModalProps {
  farmer: IFarmer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Assign fodderman: pick a village first to load foddermen for that village; PATCH sends foddermanId only.
 */
export function AssignFoddermanModal({
  farmer,
  open,
  onOpenChange,
}: AssignFoddermanModalProps) {
  const [foddermanId, setFoddermanId] = useState("");
  /** UI-only: required to load fodderman options; never sent on PATCH. */
  const [villageFilterId, setVillageFilterId] = useState("");
  const patchMutation = usePatchFarmerMutation();

  const { data: villageOptions, isLoading: isLoadingVillages } = useVillageOptionsQuery(
    farmer?.talukaId,
    farmer?.districtId,
    farmer?.stateId,
  );

  const villageSelected = Boolean(villageFilterId.trim());

  const { data: foddermanOptions, isLoading: isLoadingFoddermen } = useFoddermanOptionsQuery(
    farmer && villageSelected
      ? {
          stateId: farmer.stateId,
          districtId: farmer.districtId,
          talukaId: farmer.talukaId,
          villageId: villageFilterId.trim(),
        }
      : undefined,
    { enabled: open && Boolean(farmer) && villageSelected },
  );

  useEffect(() => {
    if (farmer && open) {
      setVillageFilterId("");
      setFoddermanId("");
    }
  }, [farmer, open]);

  const handleSave = () => {
    if (!farmer) return;
    const trimmed = foddermanId.trim();
    patchMutation.mutate(
      {
        id: farmer.id,
        payload: trimmed ? { foddermanId: trimmed } : {},
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" closeOnOutsideClick={false}>
        <DialogHeader>
          <DialogTitle>Assign Fodderman</DialogTitle>
          <DialogDescription>
            Select a village to load foddermen for that village, then choose who to assign to{" "}
            <span className="font-medium text-foreground">{farmer?.fullName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Village</Label>
            <SearchableSelect
              options={villageOptions}
              value={villageFilterId}
              onValueChange={(value) => {
                setVillageFilterId(value);
                setFoddermanId("");
              }}
              placeholder={
                farmer?.talukaId
                  ? isLoadingVillages
                    ? "Loading villages..."
                    : "Select village"
                  : "Farmer has no taluka"
              }
              searchPlaceholder="Search village..."
              disabled={!farmer?.talukaId || isLoadingVillages || patchMutation.isPending}
              triggerClassName="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Fodderman</Label>
            <SearchableSelect
              options={foddermanOptions}
              value={foddermanId}
              onValueChange={setFoddermanId}
              placeholder={
                !villageSelected
                  ? "Select village first"
                  : isLoadingFoddermen
                    ? "Loading foddermen..."
                    : "Select fodderman"
              }
              disabled={!villageSelected || isLoadingFoddermen || patchMutation.isPending}
              triggerClassName="h-9"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            <CancelButtonContent />
          </Button>
          <Button type="button" onClick={handleSave} disabled={patchMutation.isPending}>
            {patchMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
