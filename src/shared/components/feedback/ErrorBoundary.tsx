import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/shared/components/ui/Button";

export type ErrorBoundaryProps = {
  children: ReactNode;
  /** Tiêu đề ngắn trong fallback (tuỳ section). */
  fallbackTitle?: string;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="rounded-card border border-danger/25 bg-danger/5 p-6 text-center shadow-sm">
          <p className="font-medium text-danger">
            {this.props.fallbackTitle ?? "Đã có lỗi hiển thị"}
          </p>
          <p className="mt-2 text-sm text-warm-600">
            Phần này gặp lỗi khi render. Bạn có thể thử tải lại.
          </p>
          <Button
            type="button"
            className="mt-4"
            variant="secondary"
            onClick={this.handleRetry}
          >
            Thử lại
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
