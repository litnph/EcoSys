import type { ReactNode } from "react";

import { PageTransition } from "@/shared/components/layouts/PageTransition";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <PageTransition>{children}</PageTransition>;
}
