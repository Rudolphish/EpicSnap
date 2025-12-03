"use client";

import * as React from "react";

type ToastProps = {
  children?: React.ReactNode;
  className?: string;
};

export type ToastActionElement = React.ReactElement;

export function Toast({ children, className, ...props }: ToastProps) {
  return (
    <div
      className={["fixed bottom-4 right-4 z-50 w-full max-w-xs rounded-lg bg-white p-4 shadow-lg", "dark:bg-gray-800", className].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id}>
          {toast.title && <h4>{toast.title}</h4>}
          {toast.description && <p>{toast.description}</p>}
        </Toast>
      ))}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = React.useState<
    Array<{
      id: string;
      title?: string;
      description?: string;
      variant?: "default" | "destructive";
    }>
  >([]);

  const toast = React.useCallback(
    ({ title, description, variant = "default" }: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((currentToasts) => [...currentToasts, { id, title, description, variant }]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
      }, 5000);

      return { id };
    },
    []
  );

  const dismiss = React.useCallback((id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  return {
    toasts,
    toast,
    dismiss,
  };
}
