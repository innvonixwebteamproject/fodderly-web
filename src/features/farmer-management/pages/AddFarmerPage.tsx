import FarmerForm from "../components/FarmerForm";
import { useFarmerMutation } from "../hooks";
import type { FarmerFormSchemaType } from "../types/farmer.types";

export function AddFarmerPage() {
  const mutation = useFarmerMutation();

  const handleSubmit = (data: FarmerFormSchemaType) => {
    mutation.mutate(data);
  };

  return <FarmerForm onSubmit={handleSubmit} isLoading={mutation.isPending} />;
}
