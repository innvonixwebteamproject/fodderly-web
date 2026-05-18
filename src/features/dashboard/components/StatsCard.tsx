import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { IStatsCardProps } from "../types";
import { cn } from "@/lib/utils";

const variantStyles = {
  primary: {
    iconBg: "bg-primary/10 text-primary",
    border: "border-primary/20",
    glow: "bg-primary/20"
  },
  success: {
    iconBg: "bg-green-500/10 text-green-600 dark:text-green-400",
    border: "border-green-500/20",
    glow: "bg-green-500/20"
  },
  warning: {
    iconBg: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    border: "border-orange-500/20",
    glow: "bg-orange-500/20"
  },
  info: {
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    glow: "bg-blue-500/20"
  },
  violet: {
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
    glow: "bg-violet-500/20"
  },
  orange: {
    iconBg: "bg-orange-600/10 text-orange-700 dark:text-orange-500",
    border: "border-orange-600/20",
    glow: "bg-orange-600/20"
  }
};

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  variant = "primary",
  path,
}: IStatsCardProps) => {
  const navigate = useNavigate();
  const styles = variantStyles[variant];

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-md",
        "bg-card text-card-foreground border border-border/50",
        "h-[120px] flex items-center p-6 rounded-xl",
        path && "cursor-pointer hover:-translate-y-1 active:scale-[0.98]"
      )}
      onClick={() => path && navigate(path)}
    >
      {/* Dynamic Background Glow Layer */}
      <div 
        className={cn(
          "absolute -right-6 -top-10 w-32 h-32 rounded-full blur-3xl opacity-30 transition-opacity group-hover:opacity-50",
          styles.glow
        )}
      />
      
      <div className="flex items-center gap-5 relative z-10 w-full">
        <div 
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm",
            styles.iconBg
          )}
        >
          <Icon size={24} />
        </div>
        
        <div className="flex flex-col grow min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-foreground transition-colors">
              {value.toLocaleString()}
            </span>
          </div>
          <span className="text-sm font-medium text-muted-foreground truncate uppercase tracking-wider">
            {title}
          </span>
        </div>

        {/* Decorative corner indicator */}
        <div className={cn(
          "absolute right-0 top-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity",
          styles.iconBg.split(' ')[0]
        )} />
      </div>
    </Card>
  );
};
