import { Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AdminOrderDetail } from "../types/order.types";

interface OrderTransactionSummaryProps {
  order: AdminOrderDetail;
}

export function OrderTransactionSummary({ order }: OrderTransactionSummaryProps) {
  const { lineItems, pricing, deliveryAddress } = order;

  const addressLines = [
    deliveryAddress.line1,
    deliveryAddress.line2,
    [deliveryAddress.villageName, deliveryAddress.talukaName, deliveryAddress.districtName, deliveryAddress.stateName]
      .filter(Boolean)
      .join(", "),
    deliveryAddress.pincode,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4 text-primary" />
          Transaction summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full caption-bottom text-left text-[13px]">
            <thead className="border-b bg-muted/40 [&_tr]:border-b">
              <tr>
                <th className="h-9 px-3 text-left text-xs font-medium text-muted-foreground">Product</th>
                <th className="h-9 px-3 text-left text-xs font-medium text-muted-foreground">Qty</th>
                <th className="h-9 px-3 text-left text-xs font-medium text-muted-foreground">Unit price</th>
                <th className="h-9 px-3 text-left text-xs font-medium text-muted-foreground">Tax</th>
                <th className="h-9 px-3 text-left text-xs font-medium text-muted-foreground">Line total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={`${item.productName}-${idx}`} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{item.productName}</td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2 tabular-nums">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {item.taxAmount != null ? `₹${item.taxAmount.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums">₹{item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-2 text-sm sm:max-w-md sm:ms-auto">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{pricing.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Taxes</span>
            <span>₹{pricing.taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Delivery charges</span>
            <span>₹{pricing.deliveryCharge.toFixed(2)}</span>
          </div>
          {pricing.discountTotal != null && pricing.discountTotal > 0 ? (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Discounts</span>
              <span>−₹{pricing.discountTotal.toFixed(2)}</span>
            </div>
          ) : null}
          <Separator />
          <div className="flex justify-between gap-4 font-semibold">
            <span>Total</span>
            <span>₹{pricing.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">Delivery address</p>
          <p className="mt-1 whitespace-pre-line text-[13px] text-muted-foreground">{addressLines || "-"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
