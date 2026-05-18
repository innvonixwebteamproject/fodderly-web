import { useEffect } from "react";
import { LoaderCircleIcon, User2 } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";

/**
 * View Profile Page
 * Read-only view for Admin users
 */
export function ViewProfilePage() {
  const { profile, isLoading } = useUser();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
  });
  
  // Update form values when profile is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.data.fullName || profile.data.name || "",
        email: profile.data.email || "",
      });
    }
  }, [profile, form]);

  if (isLoading && !profile) {
     return (
        <div className="flex h-96 items-center justify-center">
            <LoaderCircleIcon className="h-8 w-8 animate-spin text-primary" />
        </div>
     );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-6 rounded-xl border shadow-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
            <User2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            View Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Your account information.
          </p>
        </div>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled
                      className="bg-muted cursor-default border-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled
                      className="bg-muted cursor-default border-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </Form>
        
        <div className="pt-4 text-center">
            <p className="text-xs text-muted-foreground italic">
                Administrator profiles are managed by the system.
            </p>
        </div>
      </div>
    </div>
  );
}
