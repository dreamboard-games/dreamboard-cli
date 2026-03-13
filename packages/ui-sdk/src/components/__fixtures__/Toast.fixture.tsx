/**
 * Toast component fixtures
 * Demonstrates various toast notification states and types
 */
import React, { useEffect } from "react";
import { ToastProvider, useToast } from "../Toast.js";

// Helper component that triggers toasts on mount
function ToastTrigger({
  type,
  message,
}: {
  type: "success" | "error" | "info" | "warning";
  message: string;
}) {
  const toast = useToast();

  useEffect(() => {
    toast[type](message, 0); // duration 0 = no auto-dismiss
  }, [toast, type, message]);

  return null;
}

// Wrapper with provider
function ToastDemo({
  type,
  message,
}: {
  type: "success" | "error" | "info" | "warning";
  message: string;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100 p-8">
        <h2 className="text-xl font-bold mb-4">Toast Demo: {type}</h2>
        <p className="text-gray-600">
          Toast should appear in bottom-right corner
        </p>
        <ToastTrigger type={type} message={message} />
      </div>
    </ToastProvider>
  );
}

// Interactive demo with buttons
function InteractiveDemo() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-100 p-8">
        <h2 className="text-xl font-bold mb-4">Interactive Toast Demo</h2>
        <ToastButtons />
      </div>
    </ToastProvider>
  );
}

function ToastButtons() {
  const toast = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => toast.success("Action completed successfully!")}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
      >
        Success Toast
      </button>
      <button
        onClick={() => toast.error("Something went wrong!")}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        Error Toast
      </button>
      <button
        onClick={() => toast.info("Here's some information")}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Info Toast
      </button>
      <button
        onClick={() => toast.warning("Please be careful!")}
        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
      >
        Warning Toast
      </button>
    </div>
  );
}

export default {
  success: <ToastDemo type="success" message="Your card was played!" />,
  error: <ToastDemo type="error" message="Invalid move - must follow suit" />,
  info: <ToastDemo type="info" message="It's your turn!" />,
  warning: <ToastDemo type="warning" message="Hearts have been broken!" />,
  interactive: <InteractiveDemo />,
};
