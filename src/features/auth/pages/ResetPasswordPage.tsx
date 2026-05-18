
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, LoaderCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, AlertIcon, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  getResetPasswordSchema,
  ResetPasswordSchemaType,
} from "../types/password.types";
import { authApi } from "../services/auth.api";
import type { ApiError } from "@/lib/api-error";
import { toast } from "sonner";

const getResetLinkErrorMessage = (error: unknown) => {
  const apiError = error as ApiError;
  const message = (apiError.data?.message || apiError.message || "").toLowerCase();

  if (message.includes("already been used") || message.includes("already used")) {
    return "This reset link has already been used. Please request a new one.";
  }

  if (message.includes("expired")) {
    return "This reset link has expired. Please request a new one to continue.";
  }

  return (
    apiError.data?.message ||
    apiError.message ||
    "This reset link is invalid. Please request a new one."
  );
};

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(getResetPasswordSchema()),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const resetLinkValidationQuery = useQuery({
    queryKey: ["check-reset-link", token],
    queryFn: () => authApi.checkResetLink(token),
    enabled: Boolean(token),
    retry: false,
  });

  const resetLinkErrorMessage = useMemo(() => {
    if (!resetLinkValidationQuery.error) {
      const response = resetLinkValidationQuery.data;
      if (!response) {
        return null;
      }

      if (response.success === false || response.data?.isValid === false) {
        return (
          response.message ||
          "This reset link has already been used. Please request a new one."
        );
      }

      return null;
    }

    return getResetLinkErrorMessage(resetLinkValidationQuery.error);
  }, [resetLinkValidationQuery.data, resetLinkValidationQuery.error]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (values: ResetPasswordSchemaType) => {
      if (!token) {
        throw new Error("Invalid or missing reset token.");
      }
      return await authApi.resetPassword({
        token,
        data: values,
      });
    },
    onSuccess: (response) => {
      toast.success(response.message || "Password reset successfully");
      navigate("/login", { replace: true });
    },
    onError: (err: Error) => {
      setError(getResetLinkErrorMessage(err) || "Failed to reset password. Please try again.");
    },
  });

  function onSubmit(values: ResetPasswordSchemaType) {
    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
      return;
    }
    if (resetLinkErrorMessage) {
      setError(resetLinkErrorMessage);
      return;
    }
    setError(null);
    resetPasswordMutation.mutate(values);
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-300">
        <div className="mb-4 rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        
        <h3 className="mb-2 text-xl font-semibold tracking-tight text-destructive">
          Invalid Request
        </h3>
        
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          Missing reset token. Please ensure you have used the correct link from your email.
        </p>

        <Button
          className="w-full max-w-xs"
          variant="outline"
          onClick={() => navigate("/login")}
        >
          Back to Login
        </Button>
      </div>
    );
  }

  if (resetLinkValidationQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-300">
        <LoaderCircleIcon className="mb-4 h-8 w-8 animate-spin text-primary" />
        <h3 className="mb-2 text-xl font-semibold tracking-tight">
          Validating Reset Link
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Please wait while we verify your password reset link.
        </p>
      </div>
    );
  }

  if (resetLinkErrorMessage) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-300">
        <div className="mb-4 rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>

        <h3 className="mb-2 text-xl font-semibold tracking-tight text-destructive">
          Reset Link Invalid
        </h3>

        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {resetLinkErrorMessage}
        </p>

        <div className="flex w-full max-w-xs flex-col gap-3">
          <Button onClick={() => navigate("/forgot-password")}>
            Request New Link
          </Button>
          <Button variant="outline" onClick={() => navigate("/login")}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="text-center space-y-2 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a new password for your account.
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>New Password</FormLabel>
                <div className="relative">
                  <Input
                    placeholder="Enter new password"
                    type={passwordVisible ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-10"
                    disabled={
                      resetPasswordMutation.isPending ||
                      resetLinkValidationQuery.isLoading
                    }
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    mode="icon"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    disabled={
                      resetPasswordMutation.isPending ||
                      resetLinkValidationQuery.isLoading
                    }
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
                  <Input
                    placeholder="Confirm new password"
                    type={confirmPasswordVisible ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-10"
                    disabled={
                      resetPasswordMutation.isPending ||
                      resetLinkValidationQuery.isLoading
                    }
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    mode="icon"
                    onClick={() =>
                      setConfirmPasswordVisible(!confirmPasswordVisible)
                    }
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    disabled={
                      resetPasswordMutation.isPending ||
                      resetLinkValidationQuery.isLoading
                    }
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
          disabled={resetPasswordMutation.isPending || resetLinkValidationQuery.isLoading}
        >
          {resetPasswordMutation.isPending ? (
            <span className="flex items-center gap-2">
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
              Resetting Password...
            </span>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    </Form>
  );
}
