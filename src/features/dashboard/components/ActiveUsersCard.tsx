import { Users, UserCheck, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActiveUsersCardProps {
  farmers: number;
  fodermans: number;
  partners: number;
}

export function ActiveUsersCard({ farmers, fodermans, partners }: ActiveUsersCardProps) {
  const categories = [
    { label: "Farmers", value: farmers, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
    { label: "Fodermans", value: fodermans, icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Partners", value: partners, icon: ShieldCheck, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" },
  ];

  return (
    <Card className="h-full border-border/50 shadow-sm relative overflow-hidden group">
      <CardHeader className="pb-2 border-none">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Active User Base
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 px-6 pb-6">
        <div className="grid grid-cols-1 divide-y divide-border/50">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 group/item">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-110", cat.bg)}>
                  <cat.icon className={cn("w-5 h-5", cat.color)} />
                </div>
                <span className="font-medium text-foreground">{cat.label}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold tracking-tight">{cat.value.toLocaleString()}</span>
                <div className="w-12 h-1 rounded-full bg-border/20 mt-1 overflow-hidden">
                  <div className={cn("h-full rounded-full", cat.bg.replace('/10', ''))} style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      {/* Decorative background element */}
       <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />
    </Card>
  );
}
