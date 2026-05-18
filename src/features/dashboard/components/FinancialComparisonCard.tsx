import { TrendingUp, Wallet, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
interface FinancialComparisonCardProps {
  inventoryCost: number;
  productCost: number;
}

export function FinancialComparisonCard({ inventoryCost, productCost }: FinancialComparisonCardProps) {
  const total = inventoryCost + productCost;
  const inventoryPercentage = (inventoryCost / total) * 100;
  const productPercentage = (productCost / total) * 100;

  return (
    <Card className="h-full border-border/50 shadow-sm relative overflow-hidden group">
      <CardHeader className="pb-2 border-none">
        <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Cost Analysis
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
                <TrendingUp className="w-4 h-4 text-primary" />
            </div>
        </div>
        <CardDescription className="text-xs">Inventory vs Product distribution</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-8">
            {/* Metric 1 */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Inventory Cost</span>
                    </div>
                    <span className="text-xl font-bold">₹{inventoryCost.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-border/20 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${inventoryPercentage}%` }} 
                    />
                </div>
            </div>

            {/* Metric 2 */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Product Cost</span>
                    </div>
                    <span className="text-xl font-bold">₹{productCost.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-border/20 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-amber-500 transition-all duration-1000" 
                        style={{ width: `${productPercentage}%` }} 
                    />
                </div>
            </div>
            
            <div className="pt-4 border-t border-border/50 flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Total Valuation</span>
                <span className="font-bold text-foreground">₹{total.toLocaleString()}</span>
            </div>
        </div>
      </CardContent>
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
    </Card>
  );
}
