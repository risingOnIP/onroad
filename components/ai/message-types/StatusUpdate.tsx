import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface StatusUpdateProps {
  status: string;
  progress?: number;
  loading?: boolean;
}

export function StatusUpdate({ status, progress, loading }: StatusUpdateProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-lg">
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
      
      <div className="flex-1">
        <div className="text-sm font-medium text-muted-foreground">
          {status}
        </div>
        
        {progress !== undefined && (
          <div className="mt-2">
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {progress}% complete
            </div>
          </div>
        )}
      </div>
    </div>
  );
}