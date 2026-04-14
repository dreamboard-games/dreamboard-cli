import "./cosmos.styles.css";
import type { ReactNode } from "react";

interface DecoratorProps {
  children: ReactNode;
}

export default function Decorator({ children }: DecoratorProps) {
  return (
    <div className="min-h-screen bg-[#f6efe3] text-foreground antialiased">
      {children}
    </div>
  );
}
