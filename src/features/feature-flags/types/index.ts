export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isEnabledGlobal: boolean;
  rolloutPercentage: number;
  isArchived: boolean;
  isEnabledForCurrentPrincipal: boolean;
}
