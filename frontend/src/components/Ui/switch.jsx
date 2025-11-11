"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/60 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
