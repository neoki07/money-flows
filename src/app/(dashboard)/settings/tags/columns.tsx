import { ColumnDef } from "@tanstack/react-table";
import { InferResponseType } from "hono";

import { client } from "@/lib/hono";

type Category = InferResponseType<
  typeof client.api.categories.$get,
  200
>["data"][0];

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "タグ名",
  },
];
