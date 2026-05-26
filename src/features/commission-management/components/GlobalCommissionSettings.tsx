import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Percent, Save, AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { getCurrentCommission, updateCommission } from "../services/commission.api";
import { commissionUpdateSchema, type CommissionUpdateFormValues, type GlobalCommissionSettings } from "../types";

export function GlobalCommissionSettings() {
  const queryClient = useQueryClient();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const { data: commissionData, isLoading } = useQuery({
    queryKey: ["commission"],
    queryFn: () => getCurrentCommission(),
  });

  const form = useForm<CommissionUpdateFormValues>({
    resolver: zodResolver(commissionUpdateSchema),
    defaultValues: {
      percent: commissionData?.data.currentRate || 0,
      reason: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: CommissionUpdateFormValues) => updateCommission(values),
    onSuccess: (data) => {
      toast.success(data.message);
      setIsUpdateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["commission"] });
      queryClient.invalidateQueries({ queryKey: ["commission-audit-logs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update commission rate");
    },
  });

  const onSubmit = (values: CommissionUpdateFormValues) => {
    updateMutation.mutate(values);
  };

  const handleOpenUpdateModal = () => {
    form.setValue("percent", commissionData?.data.currentRate || 0);
    form.setValue("reason", "");
    setIsUpdateModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Global Commission Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="h-4.5 w-4.5 text-primary" />
            Global Commission Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Rate</p>
              <p className="text-3xl font-bold text-foreground">
                {commissionData?.data.currentRate != null ? `${commissionData.data.currentRate.toFixed(1)}%` : '-'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenUpdateModal}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Update Rate
            </Button>
          </div>

          <Alert variant="secondary" className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
              Updated commission rates should apply only to new orders created after the update timestamp.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Commission Rate</DialogTitle>
            <DialogDescription>
              Enter the new commission percentage and provide a reason for this change.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Commission Percentage (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="Enter commission percentage"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Reason for Change</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter reason for updating commission rate"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUpdateModalOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Updating..." : "Update Rate"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
