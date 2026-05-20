export type { Saving, SavingDetail } from "./types";
export { savingsKeys } from "./api/savingsKeys";
export {
  useSavings,
  useSavingDetail,
  useCreateSaving,
  useUpdateSaving,
  useDeleteSaving,
  useDepositSaving,
  useWithdrawSaving,
} from "./hooks/useSavings";
