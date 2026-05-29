import { ReactNode, FormEvent } from "react";
import { UseFormReturn, FieldValues, SubmitHandler } from "react-hook-form";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { ConfirmButtonContent } from "@/components/common/confirm-button-content";

interface FormModalProps<TFormValues extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  form: UseFormReturn<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
  isPending?: boolean;
  submitLabel?: ReactNode;
  cancelLabel?: ReactNode;
  submitVariant?: "primary" | "success" | "mono" | "destructive" | "secondary" | "outline" | "dashed" | "ghost" | "dim" | "foreground" | "inverse";
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function FormModal<TFormValues extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  form,
  onSubmit,
  isPending = false,
  submitLabel = <ConfirmButtonContent />,
  cancelLabel = <CancelButtonContent />,
  submitVariant = "primary",
  children,
  maxWidth = "md",
}: FormModalProps<TFormValues>) {
  
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.stopPropagation();
    form.handleSubmit(onSubmit)(e);
  };

  const maxWidthClass = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
  }[maxWidth];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={maxWidthClass}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground text-sm">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {children}
            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {cancelLabel}
              </Button>
              <Button 
                type="submit" 
                variant={submitVariant} 
                disabled={isPending}
              >
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
