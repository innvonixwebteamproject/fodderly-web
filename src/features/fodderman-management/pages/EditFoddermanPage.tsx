import { useParams, useNavigate } from "react-router";
import { FoddermanForm } from "../components/FoddermanForm";
import { useFoddermanByIdQuery, useUpdateFoddermanMutation } from "../hooks";
import { FoddermanSchemaType } from "../types";
import { LoaderCircle } from "lucide-react";

export function EditFoddermanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: foddermanData, isLoading: isFetching } = useFoddermanByIdQuery(id);
  
  const mutation = useUpdateFoddermanMutation({
    onSuccess: () => {
      navigate("/admin/fodderman");
    },
  });

  const handleSubmit = (data: FoddermanSchemaType) => {
    if (id) {
      mutation.mutate({ id, data });
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fodderman = foddermanData?.data || null;

  return (
    <FoddermanForm 
      initialData={fodderman}
      onSubmit={handleSubmit} 
      isLoading={mutation.isPending} 
    />
  );
}
