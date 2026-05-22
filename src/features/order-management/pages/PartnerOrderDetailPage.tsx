import { format } from "date-fns";
import { Calendar, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Container } from "@/components/common/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePartnerOrderDetailQuery } from "../hooks/useOrderDetailMutations";
import type { AdminOrderListItem } from "../types/order.types";
import { OrderTransactionSummary } from "../components/OrderTransactionSummary";
import { OrderStakeholderCards } from "../components/OrderStakeholderCards";
import { OrderAuditTrail } from "../components/OrderAuditTrail";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { PaymentStatusBadge } from "../components/PaymentStatusBadge";
import { PaymentModeBadge } from "../components/PaymentModeBadge";
import { OrderDeliverySummaryCard } from "../components/OrderDeliverySummaryCard";
import { PartnerDispatchModal } from "../components/PartnerDispatchModal";
import { PartnerEtaRevisionModal } from "../components/PartnerEtaRevisionModal";
import {
  partnerCanDispatch,
  partnerCanReviseEta,
  partnerCanScheduleDelivery,
} from "../utils/partner-order-rules";
import { FarmerDetailModal } from "@/features/farmer-management/components/FarmerDetailModal";
import { FoddermanDetailModal } from "@/features/fodderman-management/components/FoddermanDetailModal";
import { PartnerDetailModal } from "@/features/partner-management/components/PartnerDetailModal";

export function PartnerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const { data: order, isLoading, isError, error } = usePartnerOrderDetailQuery(orderId);

  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchMode, setDispatchMode] = useState<"schedule" | "dispatch">("dispatch");
  const [etaOpen, setEtaOpen] = useState(false);
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


  const showDispatch = order && partnerCanDispatch(order.orderStatus, order.orderStatusApiRaw);
  const canSchedule = order && partnerCanScheduleDelivery(order);

  const handleScheduleAction = () => {
    if (!order) return;
    if (partnerCanDispatch(order.orderStatus, order.orderStatusApiRaw)) {
      setDispatchMode("schedule");
      setDispatchOpen(true);
    } else if (partnerCanReviseEta(order.orderStatus)) {
      setEtaOpen(true);
    }
  };

  const handleQuickDispatchAction = () => {
    setDispatchMode("dispatch");
    setDispatchOpen(true);
  };

  useEffect(() => {
    if (location.hash === "#partner-order-timeline" && order) {
      const t = window.setTimeout(() => {
        document.getElementById("partner-order-timeline")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [location.hash, order]);

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
          <Link to="/partner/orders">Daily Orders</Link>
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
            <p className="text-sm text-muted-foreground">
              {order.orderDate && order.orderTime
                ? `Placed on ${order.orderDate} at ${order.orderTime.toUpperCase()}`
                : `Placed on ${format(new Date(order.placedAt), "dd/MM/yyyy")} at ${format(new Date(order.placedAt), "hh:mm a").toUpperCase()}`}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {canSchedule ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 gap-1.5 border-primary/30 text-[13px] text-primary hover:bg-primary/5 hover:text-primary"
                onClick={handleScheduleAction}
              >
                <Calendar className="h-3.5 w-3.5" />
                Reschedule Delivery
              </Button>
            ) : null}
            {showDispatch ? (
              <Button
                variant="primary"
                size="sm"
                className="h-8.5 gap-1 text-[13px]"
                onClick={handleQuickDispatchAction}
              >
                <Truck className="h-3.5 w-3.5" />
                Mark as Dispatched
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

        <OrderDeliverySummaryCard order={order} />

        <OrderAuditTrail id="partner-order-timeline" entries={order.auditTrail} />
      </div>

      <PartnerDispatchModal order={listShape} open={dispatchOpen} onOpenChange={setDispatchOpen} mode={dispatchMode} />
      <PartnerEtaRevisionModal order={listShape} open={etaOpen} onOpenChange={setEtaOpen} />


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

export default PartnerOrderDetailPage;
