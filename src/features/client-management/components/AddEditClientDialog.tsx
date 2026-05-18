import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CancelButtonContent } from "@/components/common/cancel-button-content";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ActionIcon } from "@/config/icons.config";
import {
  clientSchema,
  ClientSchemaType,
  IClient,
  ContactPersonType,
} from "../types";
import { useClientMutation } from "../hooks";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { InputGroup } from "@/components/ui/input";
import { ScrollContainer } from "@/components/common/scroll-container";
import CountryList from "country-list-with-dial-code-and-flag";

const countryOptions = CountryList.getAll().map((country) => ({
  label: `${country.flag} ${country.dial_code} (${country.name})`,
  value: country.dial_code,
}));

interface AddEditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: IClient | null;
}

export function AddEditClientDialog({
  open,
  onOpenChange,
  client,
}: AddEditClientDialogProps) {
  const isEditing = !!client;
  const mutation = useClientMutation(client?.id);

  const form = useForm<ClientSchemaType>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      client_name: "",
      company_details: "",
      address: "",
      plants: [
        {
          plant_name: "",
          city: "",
          plant_location: "",
        },
      ],
      contact_persons: [
        {
          name: "",
          email: "",
          phone: "",
          country_code: "+91",
          type: ContactPersonType.TECHNICAL,
        },
      ],
    },
  });

  const {
    fields: plantFields,
    append: appendPlant,
    remove: removePlant,
  } = useFieldArray({
    control: form.control,
    name: "plants",
  });

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control: form.control,
    name: "contact_persons",
  });

  useEffect(() => {
    if (open) {
      if (client) {
        form.reset({
          client_name: client.client_name,
          company_details: client.company_details,
          address: client.address,
          plants: client.plants?.length
            ? client.plants.map((plant) => ({
                ...plant,
                plant_name: plant.plant_name || "",
                city: plant.city || "",
                plant_location: plant.plant_location || "",
              }))
            : [
                {
                  plant_name: "",
                  city: "",
                  plant_location: "",
                },
              ],
          contact_persons: client.contact_persons?.length
            ? client.contact_persons.map((cp) => ({
                ...cp,
                country_code: cp.country_code || "+91",
                phone: cp.phone || "",
              }))
            : [
                {
                  name: "",
                  email: "",
                  phone: "",
                  country_code: "+91",
                  type: ContactPersonType.TECHNICAL,
                },
              ],
        });
      } else {
        form.reset({
          client_name: "",
          company_details: "",
          address: "",
          contact_persons: [
            {
              name: "",
              email: "",
              phone: "",
              country_code: "+91",
              type: ContactPersonType.TECHNICAL,
            },
          ],
          plants: [
            {
              plant_name: "",
              city: "",
              plant_location: "",
            },
          ],
        });
      }
    }
  }, [client, open, form]);

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  const handleFormSubmit = (data: ClientSchemaType) => {
    mutation.mutate(data, {
      onSuccess: () => {
        handleDialogClose(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-start">
            {isEditing ? "Edit Client" : "Add New Client"}
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <ScrollContainer
              className="flex-1 p-4 space-y-6"
              overflowX="hidden"
              overflowY="auto"
            >
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="client_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter client name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <FormField
                    control={form.control}
                    name="company_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Company Details</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter company details"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter address"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Separator />

              {/* Plants Section */}
              <div className="flex flex-col gap-4 border p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Plants
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {plantFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border p-4 rounded-md space-y-4 relative"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {index + 1}.
                          </span>
                        </div>
                        {plantFields.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removePlant(index)}
                          >
                            <ActionIcon.Delete className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`plants.${index}.plant_name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel required>Plant Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter plant name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`plants.${index}.city`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel required>City</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter city" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`plants.${index}.plant_location`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plant Location</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter plant location"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  <div>
                    <Button
                      type="button"
                      variant="mono"
                      onClick={() =>
                        appendPlant({
                          plant_name: "",
                          city: "",
                          plant_location: "",
                        })
                      }
                    >
                      <ActionIcon.Add className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <Separator />

              {/* Contact Persons Section */}
              <div className="flex flex-col gap-4 border p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Contact Persons
                  </h4>
                </div>

                {contactFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border p-4 rounded-md space-y-4 relative"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {index + 1}.
                        </span>
                      </div>
                      {contactFields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeContact(index)}
                        >
                          <ActionIcon.Delete className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`contact_persons.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel required>Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={ContactPersonType.TECHNICAL}>
                                  Technical
                                </SelectItem>
                                <SelectItem value={ContactPersonType.PURCHASE}>
                                  Purchase
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`contact_persons.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel required>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Contact name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`contact_persons.${index}.email`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel required>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-6 gap-1">
                        <div className="col-span-2">
                          <FormField
                            control={form.control}
                            name={`contact_persons.${index}.country_code`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel required>Country Code</FormLabel>
                                <FormControl>
                                  <SearchableSelect
                                    options={countryOptions}
                                    value={field.value || ""}
                                    onValueChange={field.onChange}
                                    placeholder="Code"
                                    searchPlaceholder="Search..."
                                    isClearable={false}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="col-span-4">
                          <FormField
                            control={form.control}
                            name={`contact_persons.${index}.phone`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel required>Phone</FormLabel>
                                <InputGroup>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter phone"
                                      {...field}
                                      value={field.value || ""}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value.replace(/\D/g, ""),
                                        )
                                      }
                                    />
                                  </FormControl>
                                </InputGroup>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <Button
                    type="button"
                    variant="mono"
                    size="md"
                    onClick={() =>
                      appendContact({
                        name: "",
                        email: "",
                        phone: "",
                        country_code: "+91",
                        type: ContactPersonType.TECHNICAL,
                      })
                    }
                  >
                    <ActionIcon.Add className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Separator />

              <DialogFooter className="p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                >
                  <CancelButtonContent />
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {isEditing ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </ScrollContainer>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
