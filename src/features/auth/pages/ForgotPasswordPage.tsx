
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircleIcon, MoveLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
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
  getForgotPasswordSchema,
  ForgotPasswordSchemaType,
} from "../types/password.types";
import { authApi } from "../services/auth.api";
import type { ApiError } from "@/lib/api-error";
import { toast } from "sonner";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(getForgotPasswordSchema()),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (values: ForgotPasswordSchemaType) => {
      return await authApi.forgotPassword(values.email);
    },
    onSuccess: (response) => {
      setIsSuccess(true);
      toast.success(
        response.message || "Reset link has been sent to your registered email."
      );
    },
    onError: (err: Error) => {
      const apiError = err as ApiError;
      setError(apiError.message || "An error occurred. Please try again.");
    },
  });

  function onSubmit(values: ForgotPasswordSchemaType) {
    setError(null);
    forgotPasswordMutation.mutate(values);
  }
   
  if(isSuccess)
    {
     return (
      <div className="flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-300">
        <h3 className="mb-2 text-xl font-semibold tracking-tight">
          Check your email
        </h3>
        
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          Reset link has been sent to your registered email.{" "}
          <span className="font-medium text-foreground">
            {form.getValues("email")}
          </span>
          .{" "}
          Please check your email and reset your password.
        </p>

        <div className="w-full max-w-xs space-y-4">
          <Button
            className="w-full"
            onClick={() => navigate("/login")}
          >
            Skip for now
          </Button>

          <div className="flex items-center justify-center gap-1 text-xs">
            <span className="text-muted-foreground">
              Didn't receive an email?
            </span>
            <Button
              variant="ghost"
              className="h-auto p-0 text-xs font-semibold underline-offset-4 hover:bg-transparent hover:underline text-primary"
              onClick={() => {
                setIsSuccess(false);
                setError(null);
              }}
            >
              Resend
            </Button>
          </div>
        </div>
      </div>
    );
  }
   
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-5"
      >
        <div className="text-center space-y-1 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Forgot Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to receive a password reset link.
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

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="name@example.com"
                  {...field}
                  disabled={forgotPasswordMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={forgotPasswordMutation.isPending}
        >
          {forgotPasswordMutation.isPending ? (
            <span className="flex items-center gap-2">
              <LoaderCircleIcon className="h-4 w-4 animate-spin" /> Sending...
            </span>
          ) : (
            "Send Reset Link"
          )}
        </Button>

        <div className="text-center text-sm">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent-foreground hover:underline hover:underline-offset-2"
            >
              <MoveLeft className="size-3.5 opacity-70" /> Back to LogIn
            </Link>
          </div>
      </form>
    </Form>
  );
}
