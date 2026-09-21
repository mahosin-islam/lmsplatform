"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { User } from "@/types";

interface UserListData {
  users: User[];
  total: number;
}

export function useLearnerList() {
  const query = useQuery({
    queryKey: ["learners"],
    queryFn: async () =>
      (await apiFetch<UserListData>("/users?role=LEARNER")).data,
  });

  return {
    learners: query.data?.users ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}