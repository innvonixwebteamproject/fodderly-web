export interface UserAttachment {
  file_path: string;
  file_name: string;
}

export interface User {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  attachments?: UserAttachment[];
}

export interface UserDropdownMenuProps {
  trigger: React.ReactNode;
}

export interface SidebarFooterProps {
  isOpen: boolean;
}
