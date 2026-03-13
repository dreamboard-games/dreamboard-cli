/**
 * Cosmos Decorator (DEV ONLY)
 *
 * This file is for React Cosmos component development and is NOT included in builds.
 * It wraps all fixtures with:
 * - Tailwind CSS styles
 * - Any global providers needed for testing
 */
import "./cosmos.styles.css";
import type { ReactNode } from "react";

interface DecoratorProps {
  children: ReactNode;
}

/**
 * Global fixture decorator
 * Provides consistent styling and context for all component fixtures
 */
export default function Decorator({ children }: DecoratorProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-white antialiased">
      {children}
    </div>
  );
}
