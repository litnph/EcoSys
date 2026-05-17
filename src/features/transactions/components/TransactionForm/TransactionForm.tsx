"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { FormProvider, useForm, type Resolver } from "react-hook-form";

import type { FinSource } from "@/features/sources/types";
import { useSources } from "@/features/sources/hooks";
import { Button } from "@/shared/components/ui/Button";
import { getFinanceApiErrorMessage } from "@/features/sources/utils/apiError";
import { scrollFirstHookFormErrorIntoView } from "@/shared/lib/scrollFirstFormError";

import { useCreateTransaction } from "../../hooks/useCreateTransaction";
import { BaseFields } from "./BaseFields";
import { ConditionalFields } from "./ConditionalFields";
import { mapFormValuesToCreateBody } from "./mapFormToApi";
import { TypeSelector } from "./TypeSelector";
import {
  buildTransactionSchema,
  defaultsForTxnForm,
  type TransactionCreateFormType,
  type TransactionFormValues,
} from "./transactionFormSchema";

export interface TransactionFormProps {
  smoduleId: string;
  /** Nếu truyền sẽ bỏ qua fetch nội bộ. */
  sources?: FinSource[];
  onSucceeded?: () => void;
}

export function TransactionForm({
  smoduleId,
  sources: sourcesProp,
  onSucceeded,
}: TransactionFormProps) {
  const [submitError, setSubmitError] = useState("");
  const { data: fetchedSources } = useSources(
    sourcesProp !== undefined ? undefined : smoduleId,
  );

  const sources = useMemo(
    () => sourcesProp ?? fetchedSources ?? [],
    [sourcesProp, fetchedSources],
  );
  const createTx = useCreateTransaction(smoduleId);

  const dynamicResolver = useMemo(
    (): Resolver<TransactionFormValues> => (values, context, opts) =>
      /** Zod v4 vs `@hookform/resolvers/zod`: cast schema để tương thích kiểu. */
      (
        zodResolver as unknown as (
          schema: unknown,
        ) => Resolver<TransactionFormValues>
      )(buildTransactionSchema(values.type))(values, context, opts),
    [],
  );

  const form = useForm<TransactionFormValues>({
    resolver: dynamicResolver,
    defaultValues: defaultsForTxnForm("direct"),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { watch, handleSubmit, reset, formState } = form;
  const typeValue = watch("type");
  const sourceId = watch("sourceId");

  const currency = useMemo(() => {
    const row = sources.find((s) => s.id === sourceId);
    return row?.currency ?? "VND";
  }, [sources, sourceId]);

  function handleChangeType(next: TransactionCreateFormType) {
    const amount = watch("amount");
    const txnDate = watch("txnDate");
    reset(defaultsForTxnForm(next, { amount, txnDate }));
    setSubmitError("");
  }

  const busy = createTx.isPending;

  return (
    <FormProvider {...form}>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(
          (vals) => {
            setSubmitError("");
            const body = mapFormValuesToCreateBody(smoduleId, vals);
            createTx.mutate(body, {
              onSuccess: () => {
                reset(defaultsForTxnForm(vals.type));
                onSucceeded?.();
              },
              onError: (err) => setSubmitError(getFinanceApiErrorMessage(err)),
            });
          },
          (errs) => scrollFirstHookFormErrorIntoView(errs, form),
        )}
      >
        <TypeSelector
          value={typeValue}
          onChange={handleChangeType}
          disabled={busy}
        />

        <BaseFields
          sources={sources}
          disabled={busy}
          currency={currency}
        />

        <ConditionalFields
          smoduleId={smoduleId}
          sources={sources}
          disabled={busy}
          txnCurrency={currency}
        />

        {submitError.length > 0 ? (
          <div
            className="rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {submitError}
          </div>
        ) : null}

        <div className="sticky bottom-0 z-[1] -mx-1 border-t border-warm-100 bg-surface pb-2 pt-4 md:static md:border-t-0 md:bg-transparent md:pb-0 md:pt-0">
          <Button
            type="submit"
            className="w-full"
            disabled={busy || !formState.isDirty}
            isLoading={busy}
          >
            Lưu giao dịch
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
