import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@dreamboard/ui/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive border-[3px] wobbly-border-md",
  {
    variants: {
      variant: {
        default:
          "border-border hard-shadow hard-shadow-hover hard-shadow-active bg-white text-foreground hover:bg-primary hover:text-white",
        destructive:
          "border-border hard-shadow hard-shadow-hover hard-shadow-active bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border-border hard-shadow hard-shadow-hover hard-shadow-active bg-transparent hover:bg-muted",
        secondary:
          "border-border hard-shadow hard-shadow-hover hard-shadow-active bg-secondary text-secondary-foreground hover:bg-ring hover:text-white",
        ghost:
          "border-transparent shadow-none hover:border-border hover:bg-accent",
        link: "border-transparent shadow-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-2 has-[>svg]:px-4 text-lg",
        sm: "h-10 gap-1.5 px-4 has-[>svg]:px-3 text-base",
        lg: "h-14 px-8 has-[>svg]:px-6 text-xl",
        icon: "size-12",
        "icon-sm": "size-10",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
