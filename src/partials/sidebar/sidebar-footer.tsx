import { UserCircle2 } from "lucide-react";
import { UserDropdownMenu } from "./user-dropdown-menu";
import { buildStorageUrl } from "@/utils/storage.util";
import { STORAGE_PATH } from "@/config/constant";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import type { SidebarFooterProps } from "@/interfaces/user.interface";

/**
 * SidebarFooter Component
 * Displays user profile and dropdown menu in sidebar
 */
export function SidebarFooter({ isOpen }: SidebarFooterProps) {
  const { user } = useUser();

  const userAttachment = user?.attachments?.[0];
  const userAvatarUrl = userAttachment
    ? buildStorageUrl(userAttachment.file_path, userAttachment.file_name, STORAGE_PATH)
    : null;
  return (
    <div className="border my-3 mx-1.5 rounded-md p-1.5 bg-accent/70 overflow-hidden">
      <UserDropdownMenu
        trigger={
          <div className={cn("flex items-center gap-2.5 cursor-pointer min-w-0", isOpen ? "justify-start" : "justify-center")}>
            {userAvatarUrl ? (
              <img
                className="h-9 w-9 rounded-full object-cover shrink-0"
                src={userAvatarUrl}
                alt="User avatar"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <UserCircle2
              className={cn(
                "h-9 w-9 text-muted-foreground shrink-0",
                userAvatarUrl ? "hidden" : "",
              )}
            />
            {isOpen && (
              <span className="text-sm font-medium text-foreground truncate">
                {user?.name || "User"}
              </span>
            )}
          </div>
        }
      />
    </div>
  );
}
