import React, { Component, ErrorInfo, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WebGL Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

export function WebGLFallback({ className, message }: { className?: string, message?: string }) {
  return (
    <div className={cn("flex items-center justify-center bg-gray-100 p-4 text-center text-sm text-gray-500", className)}>
      {message || "WebGL is not supported in this browser."}
    </div>
  );
}
