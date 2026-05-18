import { SidebarFooter } from "./sidebar-footer";
import { SidebarHeader } from "./sidebar-header";
import { SidebarMenu } from "./sidebar-menu";
import { ScrollContainer } from "@/components/common/scroll-container";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

/**
 * Desktop Sidebar Component
 * Fixed sidebar with header, menu, and footer sections
 */
export function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  return (
    <div
      className={`fixed top-0 bottom-0 z-30 flex min-h-0 min-w-0 flex-col overflow-visible transition-[width] duration-300 ease-out ${
        isOpen ? "w-[var(--sidebar-width)]" : "w-[var(--sidebar-closed-width)]"
      } bg-[var(--page-bg)] dark:bg-[var(--page-bg-dark)]`}
    >
      <div className="shrink-0">
        <SidebarHeader isOpen={isOpen} toggleSidebar={toggleSidebar} />
      </div>
      <ScrollContainer
        className="sidebar-scrollbar-transparent min-h-0 flex-1"
        overflowX="hidden"
        overflowY="auto"
      >
        <SidebarMenu isOpen={isOpen} />
      </ScrollContainer>
      <div className="mt-auto shrink-0">
        <SidebarFooter isOpen={isOpen} />
      </div>
    </div>
  );
}
