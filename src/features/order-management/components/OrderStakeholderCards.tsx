import { Building2, MapPin, Phone, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminOrderDetail, OrderStakeholderSummary } from "../types/order.types";

function StakeholderCard({
  title,
  person,
  icon: Icon,
  onClick,
}: {
  title: string;
  person: OrderStakeholderSummary | null | undefined;
  icon: typeof UserRound;
  onClick?: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 py-3 text-[13px]">
        {person ? (
          <>
            {onClick ? (
              <button
                type="button"
                onClick={onClick}
                className="font-medium text-primary hover:underline transition-colors block text-left cursor-pointer"
              >
                {person.name}
              </button>
            ) : (
              <p className="font-medium text-foreground">{person.name}</p>
            )}
            {person.mobile ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {person.mobile}
              </p>
            ) : null}
            {person.villageName ? (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {person.villageName}
                {person.stateName ? `, ${person.stateName}` : ""}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-muted-foreground italic">Not linked</p>
        )}
      </CardContent>
    </Card>
  );
}

interface OrderStakeholderCardsProps {
  order: AdminOrderDetail;
  onFarmerClick?: (id: string) => void;
  onFoddermanClick?: (id: string) => void;
  onPartnerClick?: (id: string) => void;
}

export function OrderStakeholderCards({
  order,
  onFarmerClick,
  onFoddermanClick,
  onPartnerClick,
}: OrderStakeholderCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StakeholderCard
        title="Farmer"
        person={order.farmerProfile}
        icon={UserRound}
        onClick={onFarmerClick && order.farmerProfile?.id ? () => onFarmerClick(order.farmerProfile!.id) : undefined}
      />
      <StakeholderCard
        title="Fodderman"
        person={order.foddermanProfile}
        icon={UserRound}
        onClick={onFoddermanClick && order.foddermanProfile?.id ? () => onFoddermanClick(order.foddermanProfile!.id) : undefined}
      />
      <StakeholderCard
        title="Partner"
        person={order.partnerProfile}
        icon={Building2}
        onClick={onPartnerClick && order.partnerProfile?.id ? () => onPartnerClick(order.partnerProfile!.id) : undefined}
      />
    </div>
  );
}


