import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ImageImportTypeSetting } from "@/features/transactions/imageImport/types";

import {
  getImageImportTypeSettings,
  updateImageImportTypeSettings,
} from "../api/imageImportSettingsApi";
import { settingsKeys } from "../api/settingsKeys";

export function useImageImportTypeSettings(enabled = true) {
  return useQuery({
    queryKey: settingsKeys.imageImportTypes(),
    queryFn: getImageImportTypeSettings,
    staleTime: 30_000,
    retry: false,
    enabled,
  });
}

export function useUpdateImageImportTypeSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: ImageImportTypeSetting[]) =>
      updateImageImportTypeSettings(settings),
    onSuccess: (settings) => {
      queryClient.setQueryData(settingsKeys.imageImportTypes(), settings);
    },
  });
}
