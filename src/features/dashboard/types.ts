import { LucideIcon } from "lucide-react";

export interface IDashboardStats {
  clients_count: number;
  new_jobs_count: number;
  active_jobs_count: number;
  completed_jobs_count: number;
  assigned_partners_count?: number;
  
  // New Fields
  total_revenue: number;
  farmers_count: number;
  fodermans_count: number;
  partners_count: number;
  total_commissions_due: number;
  inventory_count: number;
  inventory_cost: number;
  product_cost: number;
  
  // Ranking Lists
  top_partners: IPerformanceItem[];
  top_fodermans: IFoddermanRanking[];
  
  [legacyKey: string]: number | IPerformanceItem[] | IFoddermanRanking[] | undefined;
}

export interface IPerformanceItem {
  name: string;
  rate: number;
  deliveries: number;
}

export interface IFoddermanRanking {
  name: string;
  sales: number;
  rank: number;
}

export interface DashboardApiResponse {
  data: IDashboardStats;
  message?: string;
}

export interface IStatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "info" | "violet" | "orange";
  path?: string;
}
