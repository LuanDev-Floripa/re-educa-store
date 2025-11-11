import React from "react";
import { cn } from "../../lib/utils";

const Badge = ({ children, className, variant = "default", ...props }) => {
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    secondary: "bg-muted/80 text-muted-foreground",
    destructive: "bg-destructive/10 text-destructive",
    outline:
      "border border-border/50 text-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export { Badge };
