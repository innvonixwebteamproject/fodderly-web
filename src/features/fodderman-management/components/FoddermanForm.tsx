import { useEffect, useMemo } from "react";
import { useForm, SubmitHandler, FieldErrors } from "react-hook-form";
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
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/common/container";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  DistrictSelect,
  PartnerSelect,
  StateSelect,
  TalukaSelect,
  VillageMultiSelect,
} from "@/components/common/api-selects";
import { IFodderman, FoddermanSchemaType, foddermanSchema } from "../types";
import { Loader2 } from "lucide-react";
import { LANGUAGE_OPTIONS } from "../constants";
import { useNavigate } from "react-router-dom";
import { ActionIcon } from "@/config/icons.config";
import { validatePincodeAgainstDistrict } from "@/lib/pincode-district-validator";

interface FoddermanFormProps {
  initialData?: IFodderman | null;
  onSubmit: SubmitHandler<FoddermanSchemaType>;
  isLoading?: boolean;
}

export function FoddermanForm({
  initialData,
  onSubmit,
  isLoading,
}: FoddermanFormProps) {
  const isEditing = !!initialData;
  const navigate = useNavigate();

  const form = useForm<FoddermanSchemaType>({
    resolver: zodResolver(foddermanSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      mobileNumber: "",
      stateId: "",
      districtId: "",
      talukaId: "",
      pinCode: "",
      partnerId: "",
      villageIds: [],
    },
  });

  const selectedStateId = form.watch("stateId");
  const selectedDistrictId = form.watch("districtId");
  const selectedTalukaId = form.watch("talukaId");

  useEffect(() => {
    if (initialData) {
      form.reset({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email || "",
        mobileNumber: initialData.mobileNumber,
        languagePreference: initialData.languagePreference,
        stateId: initialData.stateId,
        districtId: initialData.districtId,
        talukaId: initialData.talukaId,
        pinCode: initialData.pinCode,
        partnerId: initialData.partnerId || "",
        villageIds: initialData.villageIds || [],
      });
    }
  }, [initialData, form]);

  const selectedOptionLabels = useMemo(
    () => ({
      state: initialData?.stateId && initialData.stateName
        ? { [initialData.stateId]: initialData.stateName }
        : {},
      district: initialData?.districtId && initialData.districtName
        ? { [initialData.districtId]: initialData.districtName }
        : {},
      taluka: initialData?.talukaId && initialData.talukaName
        ? { [initialData.talukaId]: initialData.talukaName }
        : {},
      partner: initialData?.partnerId && initialData.partnerName
        ? { [initialData.partnerId]: initialData.partnerName }
        : {},
      villages: Object.fromEntries(
        (initialData?.villages || [])
          .filter((village) => village.id && village.name)
          .map((village) => [village.id, village.name]),
      ),
    }),
    [initialData],
  );

  const selectedStateName = useMemo(() => {
    if (isEditing && initialData?.stateName) {
      return initialData.stateName;
    }
    return selectedOptionLabels.state[selectedStateId] ?? "";
  }, [selectedOptionLabels.state, initialData?.stateName, isEditing, selectedStateId]);

  const selectedDistrictName = useMemo(() => {
    if (isEditing && initialData?.districtName) {
      return initialData.districtName;
    }
    return selectedOptionLabels.district[selectedDistrictId] ?? "";
  }, [selectedOptionLabels.district, initialData?.districtName, isEditing, selectedDistrictId]);

  const validateDistrictPincode = async (pinCode: string) => {
    if (isEditing) {
      return true;
    }

    if (!selectedDistrictId || !pinCode || pinCode.length < 6) {
      return true;
    }

    if (!selectedDistrictName.trim() || !selectedStateName.trim()) {
      return true;
    }

    const validation = await validatePincodeAgainstDistrict(pinCode, selectedStateName, selectedDistrictName);
    if (validation.isValid) {
      form.clearErrors("pinCode");
      return true;
    }

    if (validation.reason === "api_error") {
      form.setError("pinCode", {
        type: "manual",
        message: "Unable to validate pincode right now. Please try again.",
      });
      return false;
    }

    if (validation.reason === "state_mismatch") {
      form.setError("pinCode", {
        type: "manual",
        message: `The entered pincode does not belong to ${selectedStateName}. Expected state: ${validation.matchedStates.join(", ")}`,
      });
      return false;
    }

    if (validation.reason === "district_mismatch") {
      form.setError("pinCode", {
        type: "manual",
        message: `The entered pincode does not belong to ${selectedDistrictName}. Expected district: ${validation.matchedDistricts.join(", ")}`,
      });
      return false;
    }

    if (validation.reason === "not_found") {
      form.setError("pinCode", {
        type: "manual",
        message: "The entered pincode is not valid.",
      });
      return false;
    }

    return true;
  };

  const handleInternalSubmit: SubmitHandler<FoddermanSchemaType> = async (data) => {
    const isPincodeValid = await validateDistrictPincode(data.pinCode);
    if (!isPincodeValid) {
      return;
    }

    const duplicateVillageSelection = new Set(data.villageIds).size !== data.villageIds.length;
    if (duplicateVillageSelection) {
      form.setError("villageIds", {
        type: "manual",
        message: "Selected village is already assigned to another Fodderman.",
      });
      return;
    }

    onSubmit(data);
  };

  const handleInvalidSubmit = (errors: FieldErrors<FoddermanSchemaType>) => {
    if (errors.villageIds) {
      form.setError("villageIds", {
        type: "manual",
        message: errors.villageIds.message || "Please select at least one village.",
      });
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty && !window.confirm("You have unsaved changes. Continue?")) {
      return;
    }
    navigate("/admin/fodderman");
  };

  const isBusy = Boolean(isLoading);

  return (
    <Container className="pb-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleInternalSubmit, handleInvalidSubmit)}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditing ? "Edit Fodderman Profile" : "Create Fodderman Profile"}
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Email Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobileNumber"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>State</FormLabel>
                        <FormControl>
                          {isEditing ? (
                            <Input value={initialData?.stateName || "-"} disabled />
                          ) : (
                            <StateSelect
                              value={field.value}
                              isClearable={!isEditing}
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.clearErrors([
                                  "districtId",
                                  "talukaId",
                                  "villageIds",
                                  "pinCode",
                                ]);
                                form.setValue("districtId", "", {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                                form.setValue("talukaId", "", {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                                form.setValue("villageIds", [], {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                                form.setValue("pinCode", "", {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                              }}
                              placeholder="Select State"
                              searchPlaceholder="Search State..."
                              selectedOptionLabels={selectedOptionLabels.state}
                            />
                          )}
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
                          {isEditing ? (
                            <Input value={initialData?.districtName || "-"} disabled />
                          ) : (
                            <DistrictSelect
                              stateId={selectedStateId || undefined}
                              value={field.value}
                              isClearable={!isEditing}
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.clearErrors(["talukaId", "villageIds", "pinCode"]);
                                form.setValue("talukaId", "", {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                                form.setValue("villageIds", [], {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                                form.setValue("pinCode", "", {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                              }}
                              placeholder={
                                selectedStateId ? "Select District" : "Select State First"
                              }
                              searchPlaceholder="Search District..."
                              disabled={!selectedStateId}
                              selectedOptionLabels={selectedOptionLabels.district}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="talukaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Taluka</FormLabel>
                        <FormControl>
                          {isEditing ? (
                            <Input value={initialData?.talukaName || "-"} disabled />
                          ) : (
                            <TalukaSelect
                              stateId={selectedStateId || undefined}
                              districtId={selectedDistrictId || undefined}
                              value={field.value}
                              isClearable={!isEditing}
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.clearErrors("villageIds");
                                form.setValue("villageIds", [], {
                                  shouldDirty: true,
                                  shouldValidate: false,
                                });
                              }}
                              placeholder={
                                selectedDistrictId ? "Select Taluka" : "Select District First"
                              }
                              searchPlaceholder="Search Taluka..."
                              disabled={!selectedDistrictId}
                              selectedOptionLabels={selectedOptionLabels.taluka}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pinCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Pin Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 6-digit PIN"
                            {...field}
                            disabled={isEditing}
                            onChange={(event) => {
                              const sanitizedPin = event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 6);
                              field.onChange(sanitizedPin);
                              form.clearErrors("pinCode");
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="partnerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Partner</FormLabel>
                        <FormControl>
                          <PartnerSelect
                            districtId={selectedDistrictId || undefined}
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            placeholder="Select Partner"
                            searchPlaceholder="Search Partner..."
                            disabled={!selectedDistrictId}
                            selectedOptionLabels={selectedOptionLabels.partner}
                          />
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

              <div className="space-y-4 pt-2 border-t">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Village Allocation
                </h3>
                <FormField
                  control={form.control}
                  name="villageIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Allocated Villages</FormLabel>
                      <FormControl>
                        <VillageMultiSelect
                          stateId={selectedStateId || undefined}
                          districtId={selectedDistrictId || undefined}
                          talukaId={selectedTalukaId || undefined}
                          value={field.value}
                          onValueChange={(value) => field.onChange(value as string[])}
                          placeholder={
                            selectedTalukaId
                              ? "Select Villages"
                              : "Select Taluka First"
                          }
                          searchPlaceholder="Search Village..."
                          disabled={!selectedTalukaId}
                          selectedOptionLabels={selectedOptionLabels.villages}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
