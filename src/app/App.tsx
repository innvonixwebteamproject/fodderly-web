import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import { LoadingBarContainer } from "react-top-loading-bar";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { StoreProvider } from "@/app/providers/StoreProvider";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { AppRouter } from "@/app/router";
import { useFirebaseMessaging } from "@/hooks/useFirebaseMessaging";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";

const { BASE_URL } = import.meta.env;

function AppContent() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Initialize Firebase Messaging service only when authenticated
  // Auto-initializes and requests permission on first visit
  // Token will be generated automatically once permission is granted
  useFirebaseMessaging({
    autoInit: isAuthenticated,
    autoRequestPermission: isAuthenticated,
    autoGenerateToken: isAuthenticated,
  });

  return <AppRouter />;
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <StoreProvider>
          <ThemeProvider>
            <HelmetProvider>
              <LoadingBarContainer>
                <BrowserRouter basename={BASE_URL}>
                  <Toaster />
                  <AppContent />
                </BrowserRouter>
              </LoadingBarContainer>
            </HelmetProvider>
          </ThemeProvider>
        </StoreProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
