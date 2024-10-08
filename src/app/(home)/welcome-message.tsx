"use client";

import { useUser } from "@clerk/nextjs";

import { H1 } from "@/components/ui/h1";
import { Skeleton } from "@/components/ui/skeleton";

export function WelcomeMessage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <Skeleton className="h-9 w-72 opacity-5 sm:h-10" />;
  }

  return (
    <H1 className="text-3xl font-semibold text-white sm:text-4xl">
      ようこそ、{user?.firstName}さん！
    </H1>
  );
}
