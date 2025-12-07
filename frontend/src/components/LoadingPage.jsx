import { Mountain } from "lucide-react";

export function LoadingPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary"></div>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Mountain className="h-10 w-10 text-primary" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Loading</h1>
          <p className="text-sm text-muted-foreground">Please wait while we prepare your adventure...</p>
        </div>
        <div className="flex justify-center gap-1">
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
}
