import { useAuth } from "@/hooks/useAuth";
import CitizenDashboard from "./CitizenDashboard";
import ClerkInterface from "./ClerkInterface";
import AdminDashboard from "./AdminDashboard";
import { Navigation } from "@/components/Navigation";

export default function Home() {
  const { user, isLoading } = useAuth();

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
    return null; // This shouldn't happen as the route is protected
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'citizen' && <CitizenDashboard />}
        {user.role === 'clerk' && <ClerkInterface />}
        {user.role === 'admin' && <AdminDashboard />}
      </main>
    </div>
  );
}
