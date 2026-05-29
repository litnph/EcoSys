import { MotionConfig } from "framer-motion";

import { AppRoutes } from "@/routes/AppRoutes";
import { ReactQueryProvider } from "@/shared/components/providers/ReactQueryProvider";
import { Toaster } from "@/shared/components/ui";
import { ThemeProvider } from "@/shared/providers/theme-provider";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <ReactQueryProvider>
          <AppRoutes />
          <Toaster />
        </ReactQueryProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
