import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

// Pages
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import CitizenDashboard from "@/pages/CitizenDashboard";
import ClerkInterface from "@/pages/ClerkInterface";
import AdminDashboard from "@/pages/AdminDashboard";
import DisplayBoard from "@/pages/DisplayBoard";
import NotFound from "@/pages/not-found";
import { Navigation } from "@/components/Navigation";

// Protected Route Component
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    if (!isLoading && user && requiredRole && user.role !== requiredRole) {
      toast({
        title: "Access Denied",
        description: `This page requires ${requiredRole} access.`,
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }, [user, isLoading, requiredRole, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/display" component={DisplayBoard} />
      
      {/* Conditional Routes based on Authentication */}
      {isLoading || !user ? (
        <Route path="/" component={Login} />
      ) : (
        <>
          {/* Role-based Dashboard Routes */}
          {user.role === 'citizen' && (
            <>
              <Route path="/">
                <Navigation />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <CitizenDashboard />
                </main>
              </Route>
              <Route path="/appointments">
                <ProtectedRoute requiredRole="citizen">
                  <Navigation />
                  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <CitizenDashboard />
                  </main>
                </ProtectedRoute>
              </Route>
            </>
          )}
          
          {user.role === 'clerk' && (
            <>
              <Route path="/">
                <Navigation />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <ClerkInterface />
                </main>
              </Route>
              <Route path="/clerk">
                <ProtectedRoute requiredRole="clerk">
                  <Navigation />
                  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <ClerkInterface />
                  </main>
                </ProtectedRoute>
              </Route>
            </>
          )}
          
          {user.role === 'admin' && (
            <>
              <Route path="/">
                <Navigation />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <AdminDashboard />
                </main>
              </Route>
              <Route path="/admin">
                <ProtectedRoute requiredRole="admin">
                  <Navigation />
                  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <AdminDashboard />
                  </main>
                </ProtectedRoute>
              </Route>
            </>
          )}

          {/* Common authenticated routes */}
          <Route path="/home" component={Home} />
        </>
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
