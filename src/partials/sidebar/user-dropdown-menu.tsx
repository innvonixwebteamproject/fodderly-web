"use client";

import {
  KeyRound,
  LoaderCircle,
  SquarePen,
  UserCircle2,
  LogOut,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TruncatedCell } from "@/components/common/truncated-cell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { buildStorageUrl } from "@/utils/storage.util";
import { STORAGE_PATH } from "@/config/constant";
import { useUser } from "@/hooks/use-user";
import type { UserDropdownMenuProps } from "@/interfaces/user.interface";

/**
 * UserDropdownMenu Component
 * Provides user profile management, theme switching, and logout functionality
 */
export function UserDropdownMenu({ trigger }: UserDropdownMenuProps) {
  const navigate = useNavigate();
  const { user, role, logout, isAuthenticated } = useUser();

  const isLoading = false;

  const handleLogout = async () => {
    try {
      await logout();
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const userAttachment = user?.attachments?.[0];
  const userAvatarUrl = userAttachment
    ? buildStorageUrl(userAttachment.file_path, userAttachment.file_name, STORAGE_PATH)
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="ms-4 w-64" side="bottom" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-1">
          <div className="flex items-center gap-2 min-w-0">
            {userAvatarUrl ? (
              <img
                className="h-10 w-10 rounded-full object-cover shrink-0"
                src={userAvatarUrl}
                alt="User avatar"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <UserCircle2
              className={`h-10 w-10 text-muted-foreground shrink-0 ${
                userAvatarUrl ? "hidden" : ""
              }`}
            />
            <div className="flex flex-col min-w-0">
              <TruncatedCell 
                value={user?.name} 
                className="text-sm font-semibold" 
                maxWidth="w-full"
              />
              <TruncatedCell 
                value="Edit Profile" 
                className="text-xs text-muted-foreground" 
                maxWidth="w-full"
              />
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        {/* <DropdownMenuItem
          className="flex items-center gap-2"
          onSelect={(event) => event.preventDefault()}
        >
          <Moon className="h-4 w-4" />
          <div className="flex items-center gap-2 justify-between grow">
            Dark Mode
            <Switch
              size="sm"
              checked={theme === "dark"}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </DropdownMenuItem> */}
        <DropdownMenuItem className="flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          <Link to="/change-password" className="w-full">
            Change Password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2">
          <SquarePen className="h-4 w-4" />
          <Link to={role === "admin" ? "/admin/profile" : "/partner/profile"} className="w-full">
            Edit Profile
          </Link>
        </DropdownMenuItem>

        <div className="p-2 mt-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </span>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to Logout?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  You will be logged out and redirected to the login page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>
                  <CancelButtonContent />
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  disabled={isLoading}
                  variant="destructive"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Logging out...
                    </span>
                  ) : (
                    "Yes, Logout"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
