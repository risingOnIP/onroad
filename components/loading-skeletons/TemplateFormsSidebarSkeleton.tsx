import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const TemplateFormsSidebarSkeleton: React.FC = () => {
  return (
    <aside className="flex h-full flex-col border-r border-gray-200">
      <header className="px-4 pt-4 pb-2">
        <Skeleton className="h-7 w-16" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
        {/* Deal-Wide Forms Section */}
        <div className="space-y-2">
          <div className="group flex w-full items-center justify-between rounded-md px-3 py-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
          <div className="space-y-2 pl-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5">
                <Skeleton className="h-4 w-4 shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Property-Specific Forms Section */}
        <div className="space-y-2">
          <div className="group flex w-full items-center justify-between rounded-md px-3 py-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
          <div className="space-y-2 pl-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5">
                <Skeleton className="h-4 w-4 shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default TemplateFormsSidebarSkeleton;