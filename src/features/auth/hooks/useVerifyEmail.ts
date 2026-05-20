"use client";

import { useMutation } from "@tanstack/react-query";

import { verifyEmail } from "../api/authApi";

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => verifyEmail(token),
  });
}
