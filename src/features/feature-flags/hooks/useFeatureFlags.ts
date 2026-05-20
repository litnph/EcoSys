"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { getFeatureFlags } from "../api/featureFlagsApi";
import { useFeatureFlagsStore } from "../stores/featureFlagsStore";

export const featureFlagKeys = {
  all: ["feature-flags"] as const,
  list: () => [...featureFlagKeys.all, "list"] as const,
};

export function useFeatureFlags(enabled = true) {
  const setFlags = useFeatureFlagsStore((s) => s.setFlags);
  const query = useQuery({
    queryKey: featureFlagKeys.list(),
    queryFn: getFeatureFlags,
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setFlags(query.data);
    }
  }, [query.data, setFlags]);

  return query;
}
