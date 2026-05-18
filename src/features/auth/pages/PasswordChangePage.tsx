import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, LoaderCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertIcon, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  getChangePasswordSchema,
  ChangePasswordSchemaType,
} from "../types/password.types";
import { authApi } from "../services/auth.api";
import type { ApiError } from "@/lib/api-error";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";

/**
 * Password Change Page
 * 
 * Allows users to change their password with current password verification (Regular Profile Update)
 */
export function PasswordChangePage() {
  const navigate = useNavigate();
  const { logout } = useUser();

  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(getChangePasswordSchema()),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values: ChangePasswordSchemaType) => {
      return await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
    },
    onSuccess: async (response) => {
      // logout and redirect to login
      toast.success(response.message || "Password updated successfully. Please login again.");
      await logout();
      navigate("/login", { replace: true });
    },
    onError: (err: Error) => {
      const apiError = err as ApiError;
      setError(apiError.message || "An error occurred during password change.");
    },
  });

  async function onSubmit(values: ChangePasswordSchemaType) {
    setError(null);
    changePasswordMutation.mutate(values);
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="text-center space-y-2 pb-4">
              <h1 className="text-2xl font-bold tracking-tight">
                Change Password
              </h1>
              <p className="text-sm text-muted-foreground">
                Update your account password.
              </p>
            </div>

            {error && (
              <Alert variant="destructive" appearance="light">
                <AlertIcon>
                  <AlertCircle className="h-4 w-4" />
                </AlertIcon>
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Current Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter current password"
                          type={currentPasswordVisible ? "text" : "password"}
                          className="pr-10"
                          disabled={changePasswordMutation.isPending}
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        mode="icon"
                        onClick={() => setCurrentPasswordVisible(!currentPasswordVisible)}
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        disabled={changePasswordMutation.isPending}
                      >
                        {currentPasswordVisible ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter new password"
                          type={passwordVisible ? "text" : "password"}
                          autoComplete="new-password"
                          className="pr-10"
                          disabled={changePasswordMutation.isPending}
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        mode="icon"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        disabled={changePasswordMutation.isPending}
                      >
                        {passwordVisible ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Confirm Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Confirm new password"
                          type={confirmPasswordVisible ? "text" : "password"}
                          autoComplete="new-password"
                          className="pr-10"
                          disabled={changePasswordMutation.isPending}
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        mode="icon"
                        onClick={() =>
                          setConfirmPasswordVisible(!confirmPasswordVisible)
                        }
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        disabled={changePasswordMutation.isPending}
                      >
                        {confirmPasswordVisible ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" /> 
                  Updating...
                </span>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
