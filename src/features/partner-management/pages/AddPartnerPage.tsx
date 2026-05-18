import { PartnerForm } from "../components/PartnerForm";
import { usePartnerMutation } from "../hooks";
import { PartnerSchemaType } from "../types";

export function AddPartnerPage() {
  const mutation = usePartnerMutation();

  const handleSubmit = (data: PartnerSchemaType) => {
    mutation.mutate(data);
  };

  return <PartnerForm onSubmit={handleSubmit} isLoading={mutation.isPending} />;
}
