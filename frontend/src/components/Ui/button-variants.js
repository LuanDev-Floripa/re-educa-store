import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-primary/90 hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.1)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-destructive/90 hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.1)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-border/50 bg-background shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-accent hover:text-accent-foreground hover:border-border dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:bg-secondary/80 hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.1)]",
        ghost:
          "hover:bg-accent/50 hover:text-accent-foreground dark:hover:bg-accent/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-lg gap-2 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
