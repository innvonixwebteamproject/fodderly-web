import { Trophy, Star, ArrowUpRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RankingItem {
  name: string;
  metric: string | number;
  subMetric?: string | number;
  rank?: number;
}

interface RankingListCardProps {
  title: string;
  items: RankingItem[];
  type: "partner" | "fodderman";
}

export function RankingListCard({ title, items, type }: RankingListCardProps) {
  return (
    <Card className="h-full border-border/50 shadow-sm relative overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/30">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className="p-1.5 bg-primary/10 rounded-lg">
          {type === "partner" ? <Star className="w-4 h-4 text-primary" /> : <Trophy className="w-4 h-4 text-primary" />}
        </div>
      </CardHeader>
      <CardContent className="pt-2 px-0">
        <div className="divide-y divide-border/30">
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors group/row"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  idx === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : 
                  idx === 1 ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" :
                  idx === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" :
                  "bg-muted text-muted-foreground"
                )}>
                  {idx + 1}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground group-hover/row:text-primary transition-colors">
                    {item.name}
                  </span>
                  {item.subMetric && (
                    <span className="text-xs text-muted-foreground">
                       {type === "partner" ? `Success Rate: ${item.subMetric}%` : `${item.subMetric} sales`}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-bold">
                        {type === "partner" ? `${item.metric}%` : `₹${item.metric.toLocaleString()}`}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{idx === 0 ? '12' : '5'}%</span>
                    </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover/row:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
