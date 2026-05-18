import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, LoaderCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth.store";
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
  getForceChangePasswordSchema,
  ForceChangePasswordSchemaType,
} from "../types/password.types";
import { authApi } from "../services/auth.api";
import type { ApiError } from "@/lib/api-error";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";

/**
 * Force Password Change Page
 * 
 * Mandatory password update for users with temporary passwords (Not onboarded)
 */
export function ForcePasswordChangePage() {
  const navigate = useNavigate();
  const { role, userEmail, loginSuccess } = useAuthStore();
  const { logout } = useUser();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForceChangePasswordSchemaType>({
    resolver: zodResolver(getForceChangePasswordSchema()),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const forceChangePasswordMutation = useMutation({
    mutationFn: async (values: ForceChangePasswordSchemaType) => {
      return await authApi.forceChangePassword({
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
    },
    onSuccess: async (response, values) => {
      if (role === "partner" && userEmail) {
        try {
          const loginResponse = await authApi.login({
            email: userEmail,
            password: values.newPassword,
          });

          loginSuccess(loginResponse.data);
          toast.success(response.message || "Password updated successfully.");
          navigate("/dashboard", { replace: true });
          return;
        } catch {
          toast.success(response.message || "Password updated successfully.");
          toast.error("Please login again with your new password.");
          await logout();
          navigate("/login", { replace: true });
          return;
        }
      }

      toast.success(
        response.message || "Password updated successfully. Please login with your new password.",
      );
      await logout();
      navigate("/login", { replace: true });
    },
    onError: (err: Error) => {
      const apiError = err as ApiError;
      setError(apiError.message || "An error occurred during password update.");
    },
  });

  async function onSubmit(values: ForceChangePasswordSchemaType) {
    setError(null);
    forceChangePasswordMutation.mutate(values);
  }

  if (role === "admin") {
    return <Navigate to="/error/403" replace />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-5"
      >
        <div className="text-center space-y-1 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Update Force Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Your account requires a password update before proceeding.
          </p>
        </div>

        {error && (
          <Alert
            variant="destructive"
            appearance="light"
            onClose={() => setError(null)}
          >
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <div className="space-y-4">
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
                      disabled={forceChangePasswordMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    mode="icon"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    disabled={forceChangePasswordMutation.isPending}
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
                      disabled={forceChangePasswordMutation.isPending}
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
                    disabled={forceChangePasswordMutation.isPending}
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
          disabled={forceChangePasswordMutation.isPending}
        >
          {forceChangePasswordMutation.isPending ? (
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
  );
}
