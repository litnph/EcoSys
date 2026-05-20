"use client";

import { useQuery } from "@tanstack/react-query";

import { getMyOrganizations } from "../api/organizationsApi";

export const MY_ORGANIZATIONS_QUERY_KEY = ["organizations", "mine"] as const;

export function useMyOrganizations(enabled = true) {
  return useQuery({
    queryKey: MY_ORGANIZATIONS_QUERY_KEY,
    queryFn: async () => {
      const res = await getMyOrganizations();
      return res.data;
    },
    enabled,
  });
}
