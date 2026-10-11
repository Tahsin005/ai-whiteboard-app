import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ label = "Loading..." }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-4">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="mt-3 text-xs text-muted-foreground tracking-wide font-medium">
        {label}
      </p>
    </div>
  );
};

export default LoadingSpinner;
