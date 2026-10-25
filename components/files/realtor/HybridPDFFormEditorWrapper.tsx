"use client";

import dynamic from "next/dynamic";
import { ComponentProps } from "react";

// Dynamically import the Hybrid PDF editor to avoid SSR issues with Fabric.js
const HybridPDFFormEditor = dynamic(
  () => import("./HybridPDFFormEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading PDF Editor...</p>
        </div>
      </div>
    ),
  }
);

// Type the props
type HybridPDFFormEditorProps = ComponentProps<typeof HybridPDFFormEditor>;

// Export wrapper component
export default function HybridPDFFormEditorWrapper(props: HybridPDFFormEditorProps) {
  return <HybridPDFFormEditor {...props} />;
}