import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  (typeof client.api)["chart-layouts"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api)["chart-layouts"]["$post"]
>["json"];

export function useCreateChartLayout() {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api["chart-layouts"].$post({ json });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-layouts"] });
    },
    onError: () => {
      toast.error("レイアウトの変更に失敗しました");
    },
  });

  return mutation;
}
