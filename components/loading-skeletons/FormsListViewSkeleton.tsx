import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const FormsListViewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-20 rounded" />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="w-5 h-5 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Forms with Signature Progress */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, formIndex) => (
          <Card key={formIndex} className="overflow-hidden">
            <CardHeader className="bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-24 rounded" />
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Signing Steps */}
                {Array.from({ length: 2 }).map((_, stepIndex) => (
                  <div key={stepIndex}>
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    
                    <div className="grid gap-3 ml-11">
                      {Array.from({ length: 2 }).map((_, signerIndex) => (
                        <div key={signerIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-4 h-4 rounded" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {stepIndex < 1 && (
                      <div className="flex justify-center mt-4">
                        <Skeleton className="w-px h-6" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FormsListViewSkeleton;