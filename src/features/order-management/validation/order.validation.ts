import { z } from "zod";
import { isBefore, parse, startOfDay } from "date-fns";
/** Schedule delivery form — calendar date; API sends `expected_delivery` via `serializeUpdateExpectedDeliveryBody`. */
export const orderQuickUpdateSchema = z
  .object({
    expectedDelivery: z.string().min(1, "Expected delivery date is required"),
  })
  .superRefine((data, ctx) => {
    const trimmed = data.expectedDelivery.trim();
    const parsed = parse(trimmed, "yyyy-MM-dd", new Date());
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid date",
        path: ["expectedDelivery"],
      });
      return;
    }
    if (isBefore(startOfDay(parsed), startOfDay(new Date()))) {
      ctx.addIssue({
        code: "custom",
        message: "You cannot select a date in the past.",
        path: ["expectedDelivery"],
      });
    }
  });

export type OrderQuickUpdateFormValues = z.infer<typeof orderQuickUpdateSchema>;

const dateNotInPastRefine = (dateStr: string, ctx: z.RefinementCtx, path: (string | number)[]) => {
  const trimmed = dateStr.trim();
  if (!trimmed) return;
  const parsed = parse(trimmed, "yyyy-MM-dd", new Date());
  if (Number.isNaN(parsed.getTime())) {
    ctx.addIssue({ code: "custom", message: "Invalid date", path });
    return;
  }
  if (isBefore(startOfDay(parsed), startOfDay(new Date()))) {
    ctx.addIssue({
      code: "custom",
      message: "Delivery date cannot be in the past.",
      path,
    });
  }
};

export const partnerDispatchDateSchema = z
  .object({
    expectedDeliveryDate: z.string().min(1, "Please select expected delivery date."),
  })
  .superRefine((data, ctx) => dateNotInPastRefine(data.expectedDeliveryDate, ctx, ["expectedDeliveryDate"]));

export type PartnerDispatchDateFormValues = z.infer<typeof partnerDispatchDateSchema>;

export const partnerEtaRevisionDateSchema = z
  .object({
    newExpectedDeliveryDate: z.string().min(1, "Please select expected delivery date."),
  })
  .superRefine((data, ctx) => dateNotInPastRefine(data.newExpectedDeliveryDate, ctx, ["newExpectedDeliveryDate"]));

export type PartnerEtaRevisionDateFormValues = z.infer<typeof partnerEtaRevisionDateSchema>;

export const adminCancelOrderSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(2000),
});

export type AdminCancelOrderFormValues = z.infer<typeof adminCancelOrderSchema>;

export const manualRefundCompleteSchema = z
  .object({
    transactionReference: z.string().max(120).optional().nullable(),
    bankUtr: z.string().max(120).optional().nullable(),
  })
  .refine((data) => Boolean(data.transactionReference?.trim() || data.bankUtr?.trim()), {
    message: "Enter Bank UTR or transaction reference",
    path: ["transactionReference"],
  });

export type ManualRefundCompleteFormValues = z.infer<typeof manualRefundCompleteSchema>;
