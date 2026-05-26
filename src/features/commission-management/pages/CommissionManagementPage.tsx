import { useState } from "react";
import { Container } from "@/components/common/container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalCommissionSettings } from "../components/GlobalCommissionSettings";
import { CommissionAuditTrail } from "../components/CommissionAuditTrail";
import { MasterCommissionLedger } from "../components/MasterCommissionLedger";
import { OrderCommissionDetailsModal } from "../components/OrderCommissionDetailsModal";
import { PayoutSettlementModal } from "../components/PayoutSettlementModal";
import { PayoutHistory } from "../components/PayoutHistory";
import { type CommissionLedgerItem } from "../types";

export function CommissionManagementPage() {
  const [selectedFodderman, setSelectedFodderman] = useState<{ id: string; name: string } | null>(null);
  const [settlementFodderman, setSettlementFodderman] = useState<CommissionLedgerItem | null>(null);

  const handleViewOrderDetails = (foddermanId: string, foddermanName: string) => {
    setSelectedFodderman({ id: foddermanId, name: foddermanName });
  };

  const handleSettleAccount = (fodderman: CommissionLedgerItem) => {
    setSettlementFodderman(fodderman);
  };

  return (
    <Container className="pb-8">
      <div className="flex h-full min-h-0 flex-col gap-6">
        <Tabs defaultValue="settings" className="flex flex-col gap-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:inline-grid">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
            <TabsTrigger value="payout-history">Payout History</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <GlobalCommissionSettings />
          </TabsContent>

          <TabsContent value="ledger" className="space-y-6">
            <MasterCommissionLedger
              onViewOrderDetails={handleViewOrderDetails}
              onSettleAccount={handleSettleAccount}
            />
          </TabsContent>

          <TabsContent value="audit-trail" className="space-y-6">
            <CommissionAuditTrail />
          </TabsContent>

          <TabsContent value="payout-history" className="space-y-6">
            <PayoutHistory />
          </TabsContent>
        </Tabs>
      </div>

      <OrderCommissionDetailsModal
        isOpen={!!selectedFodderman}
        onClose={() => setSelectedFodderman(null)}
        foddermanId={selectedFodderman?.id || ""}
        foddermanName={selectedFodderman?.name || ""}
      />

      <PayoutSettlementModal
        isOpen={!!settlementFodderman}
        onClose={() => setSettlementFodderman(null)}
        fodderman={settlementFodderman}
      />
    </Container>
  );
}
