import { useAuth } from "@/hooks/useAuth";
import CitizenDashboard from "./CitizenDashboard";
import ClerkInterface from "./ClerkInterface";
import AdminDashboard from "./AdminDashboard";
import { Navigation } from "@/components/Navigation";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center animate-fade-in-scale">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto mb-6"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 absolute top-0 left-0"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Loading eQueue 2.0</h3>
            <p className="text-gray-600">Preparing your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // This shouldn't happen as the route is protected
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-slide-in-up">
          {user.role === 'citizen' && <CitizenDashboard />}
          {user.role === 'clerk' && <ClerkInterface />}
          {user.role === 'admin' && <AdminDashboard />}
        </div>
      </main>
    </div>
  );
}
