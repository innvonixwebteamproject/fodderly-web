import { useEffect, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/common/container";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { SearchableSelectMulti } from "@/components/ui/searchable-select-multi";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useNavigate } from "react-router-dom";
import { IPartner, PartnerSchemaType, partnerSchema } from "../types";
import { Loader2, X } from "lucide-react";
import { ActionIcon } from "@/config/icons.config";
import { COMPANY_TYPE_OPTIONS } from "../constants";
import {
  usePartnerDistrictsQuery,
  usePartnerStatesQuery,
} from "../hooks";

interface PartnerFormProps {
  initialData?: IPartner | null;
  onSubmit: SubmitHandler<PartnerSchemaType>;
  isLoading?: boolean;
}

export function PartnerForm({
  initialData,
  onSubmit,
  isLoading,
}: PartnerFormProps) {
  const isEditing = !!initialData;
  const navigate = useNavigate();

  const form = useForm<PartnerSchemaType>({
    resolver: zodResolver(partnerSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      stateId: "",
      districtIds: [],
      companyType: undefined,
      companyName: "",
      companyCertificate: "",
      gstNumber: "",
      cinNumber: "",
    },
  });

  const { data: statesResponse, isLoading: isLoadingStates } = usePartnerStatesQuery();
  const selectedStateId = form.watch("stateId");
  const { data: districtsResponse, isLoading: isLoadingDistricts } =
    usePartnerDistrictsQuery(selectedStateId, Boolean(selectedStateId));

  // Fetch all districts once to build the map for initial state derivation (editing)
  const { data: allDistrictsResponse } = usePartnerDistrictsQuery();

  const states = useMemo(() => statesResponse?.data ?? [], [statesResponse?.data]);
  const districts = useMemo(
    () => districtsResponse?.data ?? [],
    [districtsResponse?.data],
  );
  const allDistricts = useMemo(
    () => allDistrictsResponse?.data ?? [],
    [allDistrictsResponse?.data],
  );

  const stateOptions = useMemo(
    () =>
      states
        .filter((state) => state.id)
        .map((state) => ({
          value: state.id,
          label: state.name,
        })),
    [states],
  );

  const districtStateMap = useMemo(
    () => new Map(allDistricts.map((district) => [district.id, district.stateId])),
    [allDistricts],
  );

  useEffect(() => {
    if (!initialData) {
      return;
    }

    const firstMappedDistrictId = initialData.districtIds.find((districtId) =>
      districtStateMap.has(districtId),
    );
    const derivedStateId = firstMappedDistrictId
      ? districtStateMap.get(firstMappedDistrictId)
      : "";

    form.reset({
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      stateId: derivedStateId || "",
      districtIds: initialData.districtIds || [],
      companyType: initialData.companyType || undefined,
      companyName: initialData.companyName || "",
      companyCertificate: initialData.companyCertificate || "",
      gstNumber: initialData.gstNumber || "",
      cinNumber: initialData.cinNumber || "",
    });
  }, [districtStateMap, form, initialData]);

  const isBusy = isLoading || isLoadingStates || isLoadingDistricts;

  const districtOptions = useMemo(
    () =>
      districts.map((district) => ({
        value: district.id,
        label: district.name,
      })),
    [districts],
  );

  const handleCancel = () => {
    if (
      form.formState.isDirty &&
      !window.confirm("You have unsaved changes. Continue?")
    ) {
      return;
    }

    navigate("/admin/partners");
  };

  return (
    <Container className="pb-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditing ? "Edit Partner Profile" : "Create Partner Profile"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter First Name" {...field} />
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
                        <FormLabel required>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Last Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Email Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Mobile Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 10-digit mobile number"
                            {...field}
                            value={field.value || ""}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value.replace(/\D/g, "").slice(0, 10),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Geographical Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>State</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={stateOptions}
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue("districtIds", [], {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }}
                            placeholder="Select State"
                            searchPlaceholder="Search State..."
                            disabled={isLoadingStates}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="districtIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>District</FormLabel>
                        <FormControl>
                          <SearchableSelectMulti
                            options={districtOptions}
                            value={field.value}
                            onValueChange={(value) => {
                              form.setValue("districtIds", value, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                            }}
                            placeholder={
                              selectedStateId
                                ? "Select Districts"
                                : "Select State First"
                            }
                            searchPlaceholder="Search District..."
                            disabled={!selectedStateId || isLoadingDistricts}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Company Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Company Type</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={COMPANY_TYPE_OPTIONS.map((item) => ({
                              value: item.value,
                              label: item.label,
                            }))}
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            placeholder="Select Company Type"
                            searchPlaceholder="Search Company Type..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gstNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>GST Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 15-character GST Number"
                            {...field}
                            value={field.value || ""}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cinNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>CIN Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 21-character CIN Number"
                            {...field}
                            value={field.value || ""}
                            onChange={(event) =>
                              field.onChange(
                                event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 21),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="companyCertificate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Certificate</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            field.onChange(file || "");
                          }}
                        />
                      </FormControl>
                      {typeof field.value === "string" && field.value ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Current file:{" "}
                            <a
                              href={field.value}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              View certificate
                            </a>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              field.onChange("");
                              form.clearErrors("companyCertificate");
                            }}
                            aria-label="Remove current certificate"
                            title="Remove current certificate"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Allowed formats: PDF, JPG, PNG. Max size: 5MB.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleCancel}
              >
                <CancelButtonContent />
              </Button>
              <Button
                type="submit"
                disabled={isBusy}
                size="lg"
                variant="primary"
              >
                {isBusy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ActionIcon.Save className="h-4 w-4" />
                    {isEditing ? "Update" : "Create"}
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </Container>
  );
}
