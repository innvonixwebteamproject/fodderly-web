import { Badge } from "@/components/ui/badge";

export type BadgeVariant = "primary" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";

export interface BadgeConfig {
  variant: BadgeVariant;
  label: string;
  appearance?: "default" | "light" | "outline" | "ghost";
}

interface DynamicBadgeProps {
  status: string;
  config: Record<string, BadgeConfig>;
  defaultConfig?: BadgeConfig;
  size?: "lg" | "md" | "sm" | "xs";
  shape?: "default" | "circle";
}

export function DynamicBadge({ 
  status, 
  config, 
  defaultConfig = { variant: "secondary", label: status, appearance: "light" },
  size = "sm",
  shape = "circle"
}: DynamicBadgeProps) {
  const badgeConfig = config[status] || defaultConfig;

  return (
    <Badge 
      variant={badgeConfig.variant} 
      appearance={badgeConfig.appearance || "light"} 
      size={size} 
      shape={shape}
    >
      {badgeConfig.label}
    </Badge>
  );
}
