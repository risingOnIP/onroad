import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const DealSettingsSectionSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded" />
            <div>
              <Skeleton className="h-8 w-40 mb-1" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Deal Information */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deal Clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-28" />
              </div>
              <Skeleton className="h-9 w-36 rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="relative border-gray-200">
                  <CardContent className="p-4">
                    {/* Client Actions */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Skeleton className="h-6 w-6 rounded" />
                      <Skeleton className="h-6 w-6 rounded" />
                    </div>

                    {/* Client Header */}
                    <div className="mb-3">
                      <Skeleton className="h-4 w-24" />
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="h-10 w-full rounded" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-10" />
                        <Skeleton className="h-10 w-full rounded" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-10 w-full rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-64 rounded" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form Template */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
              <Skeleton className="h-3 w-40 mx-auto" />
            </div>

            {/* Client Template */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
              <Skeleton className="h-3 w-44 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DealSettingsSectionSkeleton;