import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertIcon, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { Badge } from "@/components/ui/badge";
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
  getEditProfileSchema,
  EditProfileSchemaType,
} from "../types";
import type { ApiError } from "@/lib/api-error";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/common/container";
import { useAuthStore } from "../store/auth.store";
import { ActionIcon } from "@/config/icons.config";
import {
  usePartnerDistrictsQuery,
  usePartnerStatesQuery,
} from "@/features/partner-management/hooks";
import { cn } from "@/lib/utils";

const getNameParts = (profile?: {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
}) => {
  if (profile?.firstName || profile?.lastName) {
    return {
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
    };
  }

  const fullName = (profile?.fullName || profile?.name || "").trim();
  const [firstName = "", ...lastNameParts] = fullName.split(/\s+/).filter(Boolean);

  return {
    firstName,
    lastName: lastNameParts.join(" "),
  };
};

const getPrimitiveString = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "value" in value &&
    typeof value.value === "string"
  ) {
    return value.value;
  }

  return "";
};

const getStringArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

const getDistrictItems = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (
      item,
    ): item is {
      id: string;
      stateId: string;
      name: string;
    } =>
      Boolean(
        item &&
          typeof item === "object" &&
          "id" in item &&
          "stateId" in item &&
          "name" in item &&
          typeof item.id === "string" &&
          typeof item.stateId === "string" &&
          typeof item.name === "string",
      ),
  );
};

/**
 * Edit Profile Page
 * Allows Partner users to update their profile information
 */
export function EditProfilePage() {
  const { user, profile, isLoading, updateProfile, role } = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const userEmail = useAuthStore((state) => state.userEmail);
  const isPartner = role === "partner";
  const { data: statesResponse, isLoading: isLoadingStates } =
    usePartnerStatesQuery(isPartner);
  const { data: allDistrictsResponse, isLoading: isLoadingDistricts } =
    usePartnerDistrictsQuery(undefined, isPartner);
  const states = useMemo(() => statesResponse?.data ?? [], [statesResponse?.data]);
  const allDistricts = useMemo(
    () => allDistrictsResponse?.data ?? [],
    [allDistrictsResponse?.data],
  );
  const districtNameMap = useMemo(
    () => new Map(allDistricts.map((district) => [district.id, district.name])),
    [allDistricts],
  );
  const districtStateMap = useMemo(
    () => new Map(allDistricts.map((district) => [district.id, district.stateId])),
    [allDistricts],
  );
  const stateNameMap = useMemo(
    () => new Map(states.map((state) => [state.id, state.name])),
    [states],
  );
  const phone = useMemo(
    () => getPrimitiveString(profile?.data.phone),
    [profile?.data.phone],
  );
  const companyName = useMemo(
    () =>
      getPrimitiveString(
        profile?.data.company?.company_name ?? profile?.data.companyName,
      ),
    [profile?.data.company?.company_name, profile?.data.companyName],
  );
  const companyType = useMemo(
    () =>
      getPrimitiveString(
        profile?.data.company?.company_type ?? profile?.data.companyType,
      ),
    [profile?.data.company?.company_type, profile?.data.companyType],
  );
  const gstNumber = useMemo(
    () =>
      getPrimitiveString(
        profile?.data.company?.gst_number ?? profile?.data.gstNumber,
      ),
    [profile?.data.company?.gst_number, profile?.data.gstNumber],
  );
  const cinNumber = useMemo(
    () =>
      getPrimitiveString(
        profile?.data.company?.cin_number ?? profile?.data.cinNumber,
      ),
    [profile?.data.company?.cin_number, profile?.data.cinNumber],
  );
  const profileDistricts = useMemo(
    () => getDistrictItems(profile?.data.districts),
    [profile?.data.districts],
  );
  const districtIds = useMemo(
    () =>
      profileDistricts.length > 0
        ? profileDistricts.map((district) => district.id)
        : getStringArray(profile?.data.districtIds),
    [profile?.data.districtIds, profileDistricts],
  );
  const districtNames = useMemo(
    () =>
      profileDistricts.length > 0
        ? profileDistricts.map((district) => district.name).filter(Boolean)
        : districtIds
            .map((districtId) => districtNameMap.get(districtId) || districtId)
            .filter(Boolean),
    [districtIds, districtNameMap, profileDistricts],
  );
  const stateNames = useMemo(() => {
    if (profile?.data.state?.name) {
      return [profile.data.state.name];
    }

    const ids = new Set<string>();

    if (typeof profile?.data.stateId === "string" && profile.data.stateId.trim()) {
      ids.add(profile.data.stateId);
    }

    districtIds.forEach((districtId) => {
      const mappedStateId = districtStateMap.get(districtId);
      if (mappedStateId) {
        ids.add(mappedStateId);
      }
    });

    return Array.from(ids)
      .map((stateId) => stateNameMap.get(stateId) || stateId)
      .filter(Boolean);
  }, [districtIds, districtStateMap, profile?.data.state?.name, profile?.data.stateId, stateNameMap]);
  const isLoadingProfileDetails =
    isPartner &&
    districtNames.length === 0 &&
    stateNames.length === 0 &&
    (isLoadingStates || isLoadingDistricts);

  const initialValues = useMemo(() => {
    const names = getNameParts(profile?.data || {
      fullName: user.name,
      name: user.name,
    });

    return {
      email: profile?.data.email || user.email || userEmail || "",
      firstName: names.firstName,
      lastName: names.lastName,
    };
  }, [profile?.data, user.email, user.name, userEmail]);

  const form = useForm<EditProfileSchemaType>({
    resolver: zodResolver(getEditProfileSchema(role ?? "partner")),
    defaultValues: initialValues,
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [form, initialValues]);

  const updateProfileMutation = useMutation({
    mutationFn: async (values: EditProfileSchemaType) => {
      return await updateProfile(values);
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: (err: Error) => {
      const apiError = err as ApiError;
      setError(apiError.message || "An error occurred while updating profile.");
    },
  });

  function onSubmit(values: EditProfileSchemaType) {
    setError(null);
    updateProfileMutation.mutate(values);
  }

  if (isLoading && !profile) {
     return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
     );
  }

  return (
    <Container className="pb-3">
      <div className="mx-auto w-full max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {role === "admin" ? "Edit Admin Profile" : "Edit Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent
                className={cn(
                  "space-y-6",
                  isPartner && "lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0",
                )}
              >
                {error && (
                  <Alert
                    variant="destructive"
                    appearance="light"
                    className={isPartner ? "lg:col-span-2" : ""}
                  >
                    <AlertIcon>
                      <AlertCircle className="h-4 w-4" />
                    </AlertIcon>
                    <AlertTitle>{error}</AlertTitle>
                  </Alert>
                )}

                <div
                  className={cn(
                    "space-y-3",
                    isPartner && "rounded-lg border border-border/60 p-4",
                  )}
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Account Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="email@example.com"
                              {...field}
                              disabled
                              className="bg-muted text-muted-foreground opacity-100"
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            Email cannot be changed.
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isPartner && (
                      <div className="space-y-2">
                        <FormLabel>Mobile Number</FormLabel>
                        <Input
                          value={phone}
                          disabled
                          className="bg-muted text-muted-foreground opacity-100"
                        />
                        <div className="text-xs text-muted-foreground">
                          Number cannot be changed.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    "space-y-3 border-t pt-5",
                    isPartner &&
                      "border-t-0 rounded-lg border border-border/60 p-4 pt-4",
                  )}
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter First Name"
                              {...field}
                              disabled={updateProfileMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required={role !== "admin"}>
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter Last Name"
                              {...field}
                              disabled={updateProfileMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {isPartner && (
                  <div className="space-y-3 rounded-lg border border-border/60 p-4 lg:col-span-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Company Details
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <FormLabel>Company Name</FormLabel>
                        <Input
                          value={companyName || "-"}
                          disabled
                          className="bg-muted text-muted-foreground opacity-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <FormLabel>Company Type</FormLabel>
                        <Input
                          value={companyType || "-"}
                          disabled
                          className="bg-muted text-muted-foreground opacity-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <FormLabel>GST Number</FormLabel>
                        <Input
                          value={gstNumber || "-"}
                          disabled
                          className="bg-muted text-muted-foreground opacity-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <FormLabel>CIN Number</FormLabel>
                        <Input
                          value={cinNumber || "-"}
                          disabled
                          className="bg-muted text-muted-foreground opacity-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {isPartner && (
                  <div className="space-y-3 rounded-lg border border-border/60 p-4 lg:col-span-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Geographical Details
                    </h3>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="space-y-2">
                        <FormLabel>State</FormLabel>
                        <div className="min-h-10 rounded-md border bg-muted/40 px-3 py-2">
                          {isLoadingProfileDetails ? (
                            <span className="text-sm text-muted-foreground">
                              Loading assigned state...
                            </span>
                          ) : stateNames.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {stateNames.map((stateName) => (
                                <Badge
                                  key={stateName}
                                  variant="primary"
                                  appearance="outline"
                                >
                                  {stateName}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No state assigned.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <FormLabel>Districts</FormLabel>
                        <div className="min-h-10 rounded-md border bg-muted/40 px-3 py-2">
                          {isLoadingProfileDetails ? (
                            <span className="text-sm text-muted-foreground">
                              Loading assigned districts...
                            </span>
                          ) : districtNames.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {districtNames.map((districtName) => (
                                <Badge
                                  key={districtName}
                                  variant="secondary"
                                  appearance="outline"
                                >
                                  {districtName}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No districts assigned.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/dashboard")}
                >
                  <CancelButtonContent />
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  variant="primary"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ActionIcon.Save className="h-4 w-4" />
                      Update
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </Container>
  );
}
