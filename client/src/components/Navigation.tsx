import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Settings, LogOut } from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";

export function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <Users className="text-primary text-2xl" />
              <h1 className="text-xl font-bold text-primary">eQueue 2.0</h1>
            </Link>
            
            {user && (
              <nav className="hidden md:flex space-x-6">
                <Link 
                  href="/" 
                  className={`transition-colors ${isActive('/') ? 'text-primary' : 'text-foreground hover:text-primary'}`}
                  data-testid="nav-dashboard"
                >
                  {t('nav.dashboard')}
                </Link>
                
                {user.role === 'citizen' && (
                  <Link 
                    href="/appointments" 
                    className={`transition-colors ${isActive('/appointments') ? 'text-primary' : 'text-foreground hover:text-primary'}`}
                    data-testid="nav-appointments"
                  >
                    {t('nav.appointments')}
                  </Link>
                )}
                
                {user.role === 'clerk' && (
                  <Link 
                    href="/clerk" 
                    className={`transition-colors ${isActive('/clerk') ? 'text-primary' : 'text-foreground hover:text-primary'}`}
                    data-testid="nav-clerk"
                  >
                    Clerk Interface
                  </Link>
                )}
                
                {user.role === 'admin' && (
                  <Link 
                    href="/admin" 
                    className={`transition-colors ${isActive('/admin') ? 'text-primary' : 'text-foreground hover:text-primary'}`}
                    data-testid="nav-admin"
                  >
                    Admin Panel
                  </Link>
                )}
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            
            {user && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">
                    {(user.firstName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium hidden sm:block" data-testid="text-username">
                  {user.firstName || user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/api/logout'}
                  data-testid="button-logout"
                >
                  <LogOut size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
