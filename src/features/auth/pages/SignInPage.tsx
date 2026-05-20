import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
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
import { getSigninSchema, LoginResponse, SigninSchemaType } from "../types";
import { LoaderCircleIcon } from "lucide-react";
import { useLoginMutation } from "../hooks/useLoginMutation";
import type { ApiError } from "@/lib/api-error";
import { toast } from "sonner";
import { useAuthStore } from "../store/auth.store";

import { useFirebaseMessaging } from "@/hooks/useFirebaseMessaging";

export function SignInPage() {
  const navigate = useNavigate();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Firebase Messaging hook - auto-initializes and generates token if permission granted
  const { 
    token: fcmToken, 
    requestPermissionAndToken,
  } = useFirebaseMessaging({
    autoInit: true,
    autoRequestPermission: false, // Don't auto-request, let user decide
    autoGenerateToken: true, // Generate if permission already granted
  });

  const form = useForm<SigninSchemaType>({
    resolver: zodResolver(getSigninSchema()),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const loginMutation = useLoginMutation({
    onSuccess: (data: LoginResponse) => {
      if (!data.data.isActive) {
        useAuthStore.getState().logout();
        setError("Your account is inactive. Please contact the administrator.");
        return;
      }

      toast.success(data.message || "Login successful");

      // 1. Handle force password change flow (Highest priority)
      if (data.data.role === "partner" && !data.data.forcePasswordChange) {
        navigate("/force-password-change");
        return;
      }

      // 2. Handle redirection
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      const apiError = error as ApiError;
      setError(apiError.message || "An error occurred during sign-in.");
    },
  });

  async function onSubmit(values: SigninSchemaType) {
    setError(null);

    // Request/generate FCM token during login (so permission popup shows and token is cached)
    let tokenToSend = fcmToken;
    try {
      const generatedToken = await requestPermissionAndToken();
      if (generatedToken) {
        tokenToSend = generatedToken;
      }
    } catch (e) {
      console.error("Failed to request permission or token during sign in:", e);
    }

    const loginPayload = {
      email: values.email,
      password: values.password,
      ...(tokenToSend ? { deviceToken: tokenToSend } : {}),
    };

    loginMutation.mutate(loginPayload);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-5"
      >
        <div className="text-center space-y-1 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
          <p className="text-sm text-muted-foreground">
            Login with your credentials.
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
                  placeholder="Email"
                  {...field}
                  disabled={loginMutation.isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center gap-2.5">
                <FormLabel required>Password</FormLabel>
              </div>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder="Password"
                    type={passwordVisible ? "text" : "password"}
                    className="pr-8"
                    {...field}
                    disabled={loginMutation.isPending}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  mode="icon"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  disabled={loginMutation.isPending}
                >
                  {passwordVisible ? (
                    <Eye className="text-muted-foreground" />
                  ) : (
                    <EyeOff className="text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field: _field }) => (
            <FormItem className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                {/* <div className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-muted-foreground bg-background text-primary focus:ring-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      disabled={loginMutation.isPending}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    Remember me
                  </FormLabel>
                </div> */}
                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold underline text-foreground hover:text-primary"
                >
                  Forgot Password?
                </Link>
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <span className="flex items-center gap-2">
              <LoaderCircleIcon className="h-4 w-4 animate-spin" /> Logging in...
            </span>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </Form>
  );
}
