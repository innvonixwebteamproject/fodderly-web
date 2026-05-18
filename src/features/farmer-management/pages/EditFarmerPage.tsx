import { LoaderCircleIcon } from "lucide-react";
import { useParams } from "react-router-dom";
import FarmerForm from "../components/FarmerForm";
import { useFarmerMutation, useFarmerQuery } from "../hooks";
import type { FarmerFormSchemaType } from "../types/farmer.types";

export function EditFarmerPage() {
  const { id } = useParams<{ id: string }>();
  const { data: farmerResponse, isLoading: isLoadingData } = useFarmerQuery(id);
  const farmer = farmerResponse?.data;

  const mutation = useFarmerMutation(id);
  const handleSubmit = (data: FarmerFormSchemaType) => {
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
    <FarmerForm
      initialData={farmer}
      onSubmit={handleSubmit}
      isLoading={mutation.isPending}
    />
  );
}
