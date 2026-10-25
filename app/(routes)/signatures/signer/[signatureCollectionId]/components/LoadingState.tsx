import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const LoadingState: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-6">
      <Card className="w-[22rem] shadow">
        <CardContent className="space-y-4 flex flex-col items-center pt-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-center text-sm text-muted-foreground">
            Checking authentication...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};