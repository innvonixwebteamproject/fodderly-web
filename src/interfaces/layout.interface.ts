export interface AppLayoutProps {
  children: React.ReactNode;
}

export interface SidebarMenuPrimaryProps {
  isOpen: boolean;
}

export interface SidebarMenuSecondaryProps {
  isOpen: boolean;
}

export interface SidebarHeaderProps {
  onToggleSidebar: () => void;
  isOpen: boolean;
}

export interface HeaderProps {
  onToggleSidebar: () => void;
}
