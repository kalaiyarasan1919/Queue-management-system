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
import { FloatingAISupport } from "@/components/FloatingAISupport";

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
        window.location.href = "/";
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

  // Debug logging
  console.log('Router - User:', user);
  console.log('Router - IsLoading:', isLoading);
  console.log('Router - User role:', user?.role);
  console.log('Router - User keys:', user ? Object.keys(user) : 'No user');
  console.log('Router - User id:', user?.id);
  console.log('Router - User _id:', user?._id);

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: 'url(/app-bg.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <Switch>
      {/* Public Routes */}
      <Route path="/display" component={DisplayBoard} />
      <Route path="/login" component={Login} />
      
      {/* Conditional Routes based on Authentication */}
      {isLoading ? (
        <Route path="/">
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading...</p>
            </div>
          </div>
        </Route>
      ) : !user ? (
        <Route path="/" component={Login} />
      ) : (
        <>
          {/* Debug info for authenticated users */}
          <Route path="/debug">
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Debug Info</h1>
                <pre className="text-left bg-gray-100 p-4 rounded">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>
          </Route>

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

          {/* Fallback for users with unknown roles or missing roles */}
          {(!user.role || !['citizen', 'clerk', 'admin'].includes(user.role)) && (
            <Route path="/">
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Role Assignment Required</h1>
                  <p className="text-gray-600 mb-2">Your account needs a role assignment.</p>
                  <p className="text-gray-500 mb-4">Current role: {user.role || 'Not assigned'}</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Available roles: citizen, clerk, admin
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      <a href="/debug" className="text-blue-500 hover:underline">View Debug Info</a>
                    </p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Refresh Page
                    </button>
                  </div>
                </div>
              </div>
            </Route>
          )}

          {/* Default fallback route for authenticated users */}
          <Route path="/">
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to SmartQueue</h1>
                <p className="text-gray-600 mb-4">You are logged in successfully!</p>
                <p className="text-sm text-gray-500 mb-4">
                  User ID: {user?.id || user?._id || 'Unknown'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Role: {user?.role || 'Not assigned'}
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    <a href="/debug" className="text-blue-500 hover:underline">View Debug Info</a>
                  </p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </Route>

          {/* Common authenticated routes */}
          <Route path="/home" component={Home} />
        </>
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
          <FloatingAISupport />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
