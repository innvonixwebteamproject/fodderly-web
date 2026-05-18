import { useParams } from "react-router-dom";
import { LoaderCircleIcon } from "lucide-react";
import { PartnerForm } from "../components/PartnerForm";
import { usePartnerMutation, usePartnerQuery } from "../hooks";
import { PartnerSchemaType } from "../types";

export function EditPartnerPage() {
  const { id } = useParams<{ id: string }>();
  const { data: partnerResponse, isLoading: isLoadingData } = usePartnerQuery(id);
  const partner = partnerResponse?.data;

  const mutation = usePartnerMutation(id);
  const handleSubmit = (data: PartnerSchemaType) => {
    mutation.mutate(data);
  };

  if (isLoadingData) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LoaderCircleIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PartnerForm
      initialData={partner}
      onSubmit={handleSubmit}
      isLoading={mutation.isPending}
    />
  );
}
