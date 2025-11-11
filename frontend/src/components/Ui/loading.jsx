import React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./button";

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
        "animate-spin rounded-full border-2 border-border/30 border-t-primary",
        sizeClasses[size],
        className,
      )}
    />
  );
};

export const LoadingDots = ({ className }) => {
  return (
    <div className={cn("flex gap-1.5", className)}>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
      <div
        className="w-2 h-2 bg-primary rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className="w-2 h-2 bg-primary rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
  );
};

export const LoadingPulse = ({ className }) => {
  return (
    <div className={cn("flex gap-1.5", className)}>
      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
      <div
        className="w-2 h-2 bg-primary rounded-full animate-pulse"
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className="w-2 h-2 bg-primary rounded-full animate-pulse"
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
  );
};

export const LoadingCard = ({ className }) => {
  return (
    <div className={cn("animate-pulse space-y-4", className)}>
      <div className="h-4 bg-muted/50 rounded-lg w-3/4"></div>
      <div className="h-4 bg-muted/50 rounded-lg w-1/2"></div>
      <div className="h-4 bg-muted/50 rounded-lg w-2/3"></div>
    </div>
  );
};

export const LoadingPage = ({ message = "Carregando..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export const LoadingButton = ({ children, loading, loadingText = "Carregando...", ...props }) => {
  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      className={cn("inline-flex items-center justify-center", props.className)}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2.5" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
};
