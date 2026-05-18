import { SidebarMenuPrimary } from "./sidebar-menu-primary";
import { SidebarMenuSecondary } from "./sidebar-menu-secondary";

/**
 * Sidebar Menu Wrapper Component
 * Combines primary and secondary menu sections
 */
export function SidebarMenu({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="min-h-0 min-w-0 flex-1 basis-0">
      <SidebarMenuPrimary isOpen={isOpen} />
      <div className="my-4 mx-0 border-b border-input" />
      <SidebarMenuSecondary isOpen={isOpen} />
    </div>
  );
}
