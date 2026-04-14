"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@dreamboard/ui/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground data-[orientation=horizontal]:inline-flex data-[orientation=vertical]:flex data-[orientation=vertical]:flex-col data-[orientation=vertical]:justify-start h-9 w-fit data-[orientation=horizontal]:items-center data-[orientation=vertical]:items-start justify-center rounded-lg p-[3px] h-full",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  // Check if custom active styles are provided
  const hasCustomActiveStyles = className?.includes("data-[state=active]:");

  const baseActiveStyles = hasCustomActiveStyles
    ? ""
    : "data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:text-foreground dark:data-[state=active]:bg-input/30 dark:data-[state=active]:border-input data-[state=active]:shadow-sm";

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent data-[orientation=horizontal]:px-2 data-[orientation=vertical]:px-0 data-[orientation=horizontal]:py-1 data-[orientation=vertical]:py-3 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        baseActiveStyles,
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
