import { useEffect, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Container } from "@/components/common/container";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ActionIcon } from "@/config/icons.config";
import { validatePincodeAgainstDistrict } from "@/lib/pincode-district-validator";
import {
  usePartnerDistrictsQuery,
  usePartnerStatesQuery,
} from "@/features/partner-management";
import {
  useFoddermanOptionsQuery,
  useTalukaOptionsQuery,
  useVillageOptionsQuery,
} from "../hooks";
import type { IFarmer, FarmerFormSchemaType } from "../types/farmer.types";
import { farmerFormSchema } from "../types/farmer.types";
import { LANGUAGE_OPTIONS } from "../constants";

interface FarmerFormProps {
  initialData?: IFarmer | null;
  onSubmit: SubmitHandler<FarmerFormSchemaType>;
  isLoading?: boolean;
}

export function FarmerForm({ initialData, onSubmit, isLoading }: FarmerFormProps) {
  const isEditing = Boolean(initialData);
  const isReadonlyInEdit = isEditing;
  const navigate = useNavigate();

  const form = useForm<FarmerFormSchemaType>({
    resolver: zodResolver(farmerFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      pincode: "",
      address: "",
      stateId: "",
      districtId: "",
      talukaId: "",
      villageId: "",
      foddermanId: "",
      partnerId: "",
    },
  });

  const selectedStateId = form.watch("stateId");
  const selectedDistrictId = form.watch("districtId");
  const selectedTalukaId = form.watch("talukaId");
  const selectedVillageId = form.watch("villageId");
  const selectedFoddermanId = form.watch("foddermanId");

  const { data: statesResponse, isLoading: isLoadingStates } = usePartnerStatesQuery();
  const { data: districtsResponse, isLoading: isLoadingDistricts } =
    usePartnerDistrictsQuery(selectedStateId || undefined, Boolean(selectedStateId));

  const { data: talukaOptions, isLoading: isLoadingTalukas } =
    useTalukaOptionsQuery(selectedDistrictId || undefined);
  const { data: villageOptions, isLoading: isLoadingVillages } =
    useVillageOptionsQuery(selectedTalukaId || undefined);
  const foddermanGeoEnabled = Boolean(selectedStateId?.trim());
  const { data: foddermanOptions, isLoading: isLoadingFoddermen } = useFoddermanOptionsQuery(
    {
      stateId: selectedStateId || undefined,
      districtId: selectedDistrictId || undefined,
      talukaId: selectedTalukaId || undefined,
      villageId: selectedVillageId || undefined,
    },
    { enabled: foddermanGeoEnabled },
  );

  const states = useMemo(() => statesResponse?.data ?? [], [statesResponse?.data]);
  const districts = useMemo(() => districtsResponse?.data ?? [], [districtsResponse?.data]);

  const stateOptions = useMemo(
    () => states.map((state) => ({ value: state.id, label: state.name })),
    [states],
  );

  const districtOptions = useMemo(
    () => districts.map((district) => ({ value: district.id, label: district.name })),
    [districts],
  );
  const selectedStateName = useMemo(() => {
    if (initialData?.stateName && isReadonlyInEdit) {
      return initialData.stateName;
    }
    return stateOptions.find((state) => state.value === selectedStateId)?.label ?? "";
  }, [stateOptions, initialData?.stateName, isReadonlyInEdit, selectedStateId]);

  const selectedDistrictName = useMemo(() => {
    if (initialData?.districtName && isReadonlyInEdit) {
      return initialData.districtName;
    }
    return districtOptions.find((district) => district.value === selectedDistrictId)?.label ?? "";
  }, [districtOptions, initialData?.districtName, isReadonlyInEdit, selectedDistrictId]);

  useEffect(() => {
    if (!initialData) {
      return;
    }

    form.reset({
      firstName: initialData.firstName || "",
      lastName: initialData.lastName || "",
      phone: initialData.phone || "",
      languagePreference: initialData.languagePreference || "",
      pincode: initialData.pincode || "",
      address: initialData.address || "",
      stateId: initialData.stateId || "",
      districtId: initialData.districtId || "",
      talukaId: initialData.talukaId || "",
      villageId: initialData.villageId || "",
      foddermanId: initialData.foddermanId || "",
      partnerId: initialData.partnerId || "",
    });
  }, [form, initialData]);

  useEffect(() => {
    if (!selectedFoddermanId?.trim() || isLoadingFoddermen) return;
    if (foddermanOptions.length === 0) return;
    const stillValid = foddermanOptions.some((option) => option.value === selectedFoddermanId);
    if (!stillValid) {
      form.setValue("foddermanId", "", { shouldValidate: true });
    }
  }, [foddermanOptions, selectedFoddermanId, isLoadingFoddermen, form]);

  const isBusy =
    isLoading ||
    isLoadingStates ||
    isLoadingDistricts ||
    isLoadingTalukas ||
    isLoadingVillages ||
    isLoadingFoddermen;

  const handleCancel = () => {
    if (form.formState.isDirty && !window.confirm("You have unsaved changes. Continue?")) {
      return;
    }

    navigate("/admin/farmers");
  };

  const validateDistrictPincode = async (pincode: string) => {
    if (!selectedDistrictId || !pincode || pincode.length < 6) {
      return true;
    }

    if (!selectedDistrictName.trim() || !selectedStateName.trim()) {
      return true;
    }

    const validation = await validatePincodeAgainstDistrict(pincode, selectedStateName, selectedDistrictName);
    if (validation.isValid) {
      form.clearErrors("pincode");
      return true;
    }

    if (validation.reason === "api_error") {
      form.setError("pincode", {
        type: "manual",
        message: "Unable to validate pincode right now. Please try again.",
      });
      return false;
    }

    if (validation.reason === "state_mismatch") {
      form.setError("pincode", {
        type: "manual",
        message: `The entered pincode does not belong to ${selectedStateName}. Expected state: ${validation.matchedStates.join(", ")}`,
      });
      return false;
    }

    if (validation.reason === "district_mismatch") {
      form.setError("pincode", {
        type: "manual",
        message: `The entered pincode does not belong to ${selectedDistrictName}. Expected district: ${validation.matchedDistricts.join(", ")}`,
      });
      return false;
    }

    if (validation.reason === "not_found") {
      form.setError("pincode", {
        type: "manual",
        message: "The entered pincode is not valid.",
      });
      return false;
    }

    return true;
  };

  const handleInternalSubmit: SubmitHandler<FarmerFormSchemaType> = async (data) => {
    const isPincodeValid = await validateDistrictPincode(data.pincode);
    if (!isPincodeValid) {
      return;
    }
    onSubmit(data);
  };

  return (
    <Container className="pb-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleInternalSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditing ? "Edit Farmer Profile" : "Create Farmer Profile"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Basic Information
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
                  <FormField
                    control={form.control}
                    name="languagePreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Language Preference</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={LANGUAGE_OPTIONS}
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            placeholder="Select Language"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Location & Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter address"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                              form.clearErrors([
                                "districtId",
                                "talukaId",
                                "villageId",
                                "pincode",
                              ]);
                              form.setValue("districtId", "", {
                                shouldDirty: true,
                                shouldValidate: false,
                              });
                              form.setValue("talukaId", "", {
                                shouldDirty: true,
                                shouldValidate: false,
                              });
                              form.setValue("villageId", "", {
                                shouldDirty: true,
                                shouldValidate: false,
                              });
                              form.setValue("foddermanId", "", {
                                shouldDirty: true,
                                shouldValidate: false,
                              });
                            }}
                            placeholder="Select State"
                            searchPlaceholder="Search State..."
                            disabled={isLoadingStates || isReadonlyInEdit}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="districtId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>District</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={districtOptions}
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value) {
                                form.clearErrors("districtId");
                              }
                              form.clearErrors(["talukaId", "villageId", "pincode"]);
                              form.setValue("talukaId", "", {
                                shouldDirty: true,
                                shouldValidate: false,
                              });
                              form.setValue("villageId", "", {
                                shouldDirty: true,
                                shouldValidate: false,
                              });
                              form.setValue("pincode", "", {
                                shouldDirty: true,
                                shouldValidate: false,
                              });
                              form.setValue("foddermanId", "", {
                                shouldDirty: true,
                                shouldValidate: false,
                              });
                            }}
                            placeholder={selectedStateId ? "Select District" : "Select state first"}
                            searchPlaceholder="Search District..."
                            disabled={!selectedStateId || isLoadingDistricts || isReadonlyInEdit}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="talukaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Taluka</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={talukaOptions}
                            value={field.value ?? ""}
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value) {
                                form.clearErrors("talukaId");
                              }
                              form.clearErrors("villageId");
                              form.setValue("villageId", "", {
                                shouldDirty: true,
                                shouldValidate: false,
                              });
                              form.setValue("foddermanId", "", {
                                shouldDirty: true,
                                shouldValidate: false,
                              });
                            }}
                            placeholder={
                              selectedDistrictId ? "Select Taluka" : "Select district first"
                            }
                            searchPlaceholder="Search Taluka..."
                            disabled={!selectedDistrictId || isLoadingTalukas || isReadonlyInEdit}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="villageId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Village</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={villageOptions}
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value) {
                                form.clearErrors("villageId");
                              }
                              form.setValue("foddermanId", "", {
                                shouldDirty: true,
                                shouldValidate: false,
                              });
                            }}
                            placeholder={selectedTalukaId ? "Select Village" : "Select taluka first"}
                            searchPlaceholder="Search Village..."
                            disabled={!selectedTalukaId || isLoadingVillages}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Pin Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 6-digit pin code"
                            {...field}
                            value={field.value || ""}
                            onChange={(event) => {
                              const sanitizedPin = event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6);
                              field.onChange(sanitizedPin);
                              form.clearErrors("pincode");
                              if (sanitizedPin.length === 6 && selectedDistrictId) {
                                void validateDistrictPincode(sanitizedPin);
                              }
                            }}
                          />
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
                              field.onChange(event.target.value.replace(/\D/g, "").slice(0, 10))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Assignment (Fodderman)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="foddermanId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel required>Fodderman</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={foddermanOptions}
                            value={field.value ?? ""}
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value?.trim()) {
                                form.clearErrors("foddermanId");
                              }
                            }}
                            placeholder={
                              !foddermanGeoEnabled
                                ? "Select state first"
                                : isLoadingFoddermen
                                  ? "Loading foddermen..."
                                  : "Select fodderman"
                            }
                            searchPlaceholder="Search Fodderman..."
                            disabled={!foddermanGeoEnabled || isLoadingFoddermen}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3">
              <Button type="button" variant="outline" size="lg" onClick={handleCancel}>
                <CancelButtonContent />
              </Button>
              <Button type="submit" disabled={isBusy} size="lg" variant="primary">
                {isBusy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Saving..."}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ActionIcon.Save className="h-4 w-4" />
                    {isEditing ? "Update" : "Save"}
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

export default FarmerForm;
