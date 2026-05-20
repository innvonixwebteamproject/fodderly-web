import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { Container } from "@/components/common/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminOrderDetailQuery } from "../hooks/useOrderDetailMutations";
import type { AdminOrderListItem } from "../types/order.types";
import { OrderTransactionSummary } from "../components/OrderTransactionSummary";
import { OrderStakeholderCards } from "../components/OrderStakeholderCards";
import { OrderAuditTrail } from "../components/OrderAuditTrail";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { PaymentStatusBadge } from "../components/PaymentStatusBadge";
import { PaymentModeBadge } from "../components/PaymentModeBadge";
import { OrderQuickUpdateModal } from "../components/OrderQuickUpdateModal";
import { AdminCancelOrderModal } from "../components/AdminCancelOrderModal";
import { OrderDeliverySummaryCard } from "../components/OrderDeliverySummaryCard";
import { canAdminCancelOrder, canAdminScheduleDelivery } from "../utils/order-schedule-rules";
import { FarmerDetailModal } from "@/features/farmer-management/components/FarmerDetailModal";
import { FoddermanDetailModal } from "@/features/fodderman-management/components/FoddermanDetailModal";
import { PartnerDetailModal } from "@/features/partner-management/components/PartnerDetailModal";

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const ordersListPath = location.pathname.includes("/orders/cancelled-refunds/")
    ? "/admin/orders/cancelled-refunds"
    : "/admin/orders";
  const { data: order, isLoading, isError, error } = useAdminOrderDetailQuery(orderId);

  const [quickOpen, setQuickOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const [selectedFoddermanId, setSelectedFoddermanId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  const listShape = useMemo((): AdminOrderListItem | null => {
    if (!order) return null;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      placedAt: order.placedAt,
      farmer: order.farmer,
      fodderman: order.fodderman,
      partner: order.partner,
      totalAmount: order.totalAmount,
      paymentMode: order.paymentMode,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      orderStatusApiRaw: order.orderStatusApiRaw,
      paymentModeApiRaw: order.paymentModeApiRaw,
      paymentStatusLabelApi: order.paymentStatusLabelApi,
      expectedDeliveryDate: order.expectedDeliveryDate,
      dispatchedAt: order.dispatchedAt,
      deliveredAt: order.deliveredAt,
      isDelayed: order.isDelayed,
    };
  }, [order]);

  const canAdminCancel = order ? canAdminCancelOrder(order) : false;
  const canScheduleDelivery = order ? canAdminScheduleDelivery(order) : false;

  if (isLoading) {
    return (
      <Container className="pb-8">
        <p className="text-sm text-muted-foreground">Loading order…</p>
      </Container>
    );
  }

  if (isError || !order) {
    return (
      <Container className="pb-8">
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Order not found."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={ordersListPath}>Back to orders</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container className="pb-8">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">Order {order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">Placed {format(new Date(order.placedAt), "dd MMM yyyy, HH:mm")}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {canScheduleDelivery ? (
              <Button variant="outline" size="sm" className="h-8.5 gap-1.5 text-[13px]" onClick={() => setQuickOpen(true)}>
                <Calendar className="h-3.5 w-3.5" />
                Reschedule Delivery
              </Button>
            ) : null}
            {canAdminCancel ? (
              <Button variant="destructive" size="sm" className="h-8.5 text-[13px]" onClick={() => setCancelOpen(true)}>
                Force cancel
              </Button>
            ) : null}
          </div>
        </div>

        <div
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-stretch"
          aria-label="Order status summary"
        >
          <Card className="h-full border-border/70 shadow-sm">
            <CardHeader className="min-h-0 shrink-0 space-y-0 border-b px-4 py-3 sm:px-5">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Order status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-end p-0 px-4 pb-4 pt-2 sm:px-5">
              <OrderStatusBadge status={order.orderStatus} labelFromApi={order.orderStatusApiRaw} />
            </CardContent>
          </Card>
          <Card className="h-full border-border/70 shadow-sm">
            <CardHeader className="min-h-0 shrink-0 space-y-0 border-b px-4 py-3 sm:px-5">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Payment mode
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-end p-0 px-4 pb-4 pt-2 sm:px-5">
              <PaymentModeBadge mode={order.paymentMode} labelFromApi={order.paymentModeApiRaw} />
            </CardContent>
          </Card>
          <Card className="h-full border-border/70 shadow-sm">
            <CardHeader className="min-h-0 shrink-0 space-y-0 border-b px-4 py-3 sm:px-5">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Payment status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-end p-0 px-4 pb-4 pt-2 sm:px-5">
              <PaymentStatusBadge status={order.paymentStatus} labelFromApi={order.paymentStatusLabelApi} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <OrderTransactionSummary order={order} />
        <OrderStakeholderCards
          order={order}
          onFarmerClick={setSelectedFarmerId}
          onFoddermanClick={setSelectedFoddermanId}
          onPartnerClick={setSelectedPartnerId}
        />
        <OrderDeliverySummaryCard order={order} hideHistory />
        <OrderAuditTrail entries={order.auditTrail} />
      </div>

      <OrderQuickUpdateModal order={listShape} open={quickOpen} onOpenChange={setQuickOpen} />
      <AdminCancelOrderModal orderId={order.id} open={cancelOpen} onOpenChange={setCancelOpen} />

      <FarmerDetailModal
        isOpen={Boolean(selectedFarmerId)}
        onClose={() => setSelectedFarmerId(null)}
        farmerId={selectedFarmerId}
      />
      <FoddermanDetailModal
        isOpen={Boolean(selectedFoddermanId)}
        onClose={() => setSelectedFoddermanId(null)}
        foddermanId={selectedFoddermanId}
      />
      <PartnerDetailModal
        isOpen={Boolean(selectedPartnerId)}
        onClose={() => setSelectedPartnerId(null)}
        partnerId={selectedPartnerId}
      />
    </Container>
  );
}
