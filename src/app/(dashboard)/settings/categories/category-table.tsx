"use client";

import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCategories } from "@/features/categories/api/use-get-categories";

import { columns } from "./columns";

export function CategoryTable() {
  const categoriesQuery = useGetCategories({
    types: ["income", "expense"],
  });

  if (categoriesQuery.isPending) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (categoriesQuery.isError) {
    return <p>エラーが発生しました</p>;
  }

  return <DataTable columns={columns} data={categoriesQuery.data} />;
}
