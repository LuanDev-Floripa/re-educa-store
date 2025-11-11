import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input/50 placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-lg border bg-transparent px-3 py-2 text-base shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-[color,box-shadow] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-40 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
