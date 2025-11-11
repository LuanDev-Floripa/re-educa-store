import * as React from "react";
/**
 * Toggle UI (Radix Toggle wrapper).
 * Exporta componente e variantes de estilo.
 */
import * as TogglePrimitive from "@radix-ui/react-toggle";

import { cn } from "@/lib/utils";
import { toggleVariants } from "./toggle-constants";

function Toggle({ className, variant, size, ...props }) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle };

// Re-exportar constante de arquivo separado
export { toggleVariants } from "./toggle-constants";
