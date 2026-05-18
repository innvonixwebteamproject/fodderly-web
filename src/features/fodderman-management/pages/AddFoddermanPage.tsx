import { useNavigate } from "react-router";
import { FoddermanForm } from "../components/FoddermanForm";
import { useCreateFoddermanMutation } from "../hooks";
import { FoddermanSchemaType } from "../types";

export function AddFoddermanPage() {
  const navigate = useNavigate();
  const mutation = useCreateFoddermanMutation({
    onSuccess: () => {
      navigate("/admin/fodderman");
    },
  });

  const handleSubmit = (data: FoddermanSchemaType) => {
    mutation.mutate(data);
  };

  return (
    <FoddermanForm 
      onSubmit={handleSubmit} 
      isLoading={mutation.isPending} 
    />
  );
}
