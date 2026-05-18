import { Link } from "react-router-dom";
import { toAbsoluteUrl } from "@/lib/helpers";
import { ArrowLeftToLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/store/auth.store";

interface SidebarHeaderProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

/**
 * Sidebar Header Component
 * Displays logo and sidebar toggle (straddling the right edge).
 */
export function SidebarHeader({ isOpen, toggleSidebar }: SidebarHeaderProps) {
  const role = useAuthStore((state) => state.role);
  const dashboardPath = role === "admin" ? "/admin/dashboard" : "/partner/dashboard";

  return (
    <div
      className={cn(
        "relative flex h-[72px] w-full shrink-0 items-center border-b border-border/60 bg-[var(--page-bg)] dark:bg-[var(--page-bg-dark)]",
        isOpen ? "justify-center px-2.5" : "justify-between pl-3 pr-1",
      )}
    >
      <Link
        to={dashboardPath}
        className="flex items-center justify-center gap-2"
      >
        {isOpen ? (
          <>
            <img
              src={toAbsoluteUrl("/media/app/logo-dark.png")}
              className="dark:hidden h-[52px] pr-4"
              alt="Logo"
            />
            <img
              src={toAbsoluteUrl("/media/app/logo-light.png")}
              className="hidden h-[52px] pr-4 dark:inline-block"
              alt="Logo"
            />
          </>
        ) : (
          <>
            <img
              src={toAbsoluteUrl("/media/app/mini-logo-dark.png")}
              className="dark:hidden h-[40px]"
              alt="Logo"
            />
            <img
              src={toAbsoluteUrl("/media/app/mini-logo-light.png")}
              className="hidden h-[42px] dark:inline-block"
              alt="Logo"
            />
          </>
        )}
      </Link>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-accent transition absolute -right-[1rem] bg-accent border border-border hidden lg:block cursor-pointer shadow-sm z-[50]"
        aria-label="Toggle sidebar"
      >
        {isOpen ? (
          <ArrowLeftToLine size={16} className="rotate-0 transition-transform duration-300" />
        ) : (
          <ArrowLeftToLine size={16} className="rotate-180 transition-transform duration-300" />
        )}
      </button>
    </div>
  );
}
