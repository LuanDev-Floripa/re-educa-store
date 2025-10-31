import React from "react";
import { cn } from "../../lib/utils";

export const LoadingSpinner = ({ size = "md", className }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizeClasses[size],
        className,
      )}
    />
  );
};

export const LoadingDots = ({ className }) => {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
      <div
        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
  );
};

export const LoadingPulse = ({ className }) => {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
      <div
        className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
  );
};

export const LoadingCard = ({ className }) => {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
  );
};

export const LoadingPage = ({ message = "Carregando..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
};

export const LoadingButton = ({ children, loading, ...props }) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn("inline-flex items-center justify-center", props.className)}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Carregando...
        </>
      ) : (
        children
      )}
    </button>
  );
};
