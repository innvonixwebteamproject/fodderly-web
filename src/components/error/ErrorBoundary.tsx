import { Component, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error) {
    console.error("Error caught by boundary:", error);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
          <div className="max-w-md w-full space-y-4">
            <div className="flex justify-center">
              <div className="bg-destructive/10 p-4 rounded-lg">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-foreground">
                Something went wrong
              </h1>
              <p className="text-muted-foreground">
                An unexpected error occurred. Please try again.
              </p>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h2 className="font-semibold text-sm text-foreground">
                  Error Details (Development Only):
                </h2>
                <p className="text-xs font-mono text-destructive break-words">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-semibold text-muted-foreground">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-destructive/70 overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={this.handleReset}
                className="flex-1"
                variant="primary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
              <Button
                onClick={() => window.location.href = "/"}
                className="flex-1"
                variant="outline"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
