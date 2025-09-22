import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Settings, LogOut } from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const isActive = (path: string) => location === path;

  return (
    <header className="glass-effect sticky top-0 z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 group" data-testid="link-home">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Users className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  eQueue 2.0
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Smart Token Generator</p>
              </div>
            </Link>
            
            {user && (
              <nav className="hidden md:flex space-x-2">
                <Link 
                  href="/" 
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isActive('/') 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  data-testid="nav-dashboard"
                >
                  {t('nav.dashboard')}
                </Link>
                
                {user.role === 'citizen' && (
                  <Link 
                    href="/appointments" 
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isActive('/appointments') 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    data-testid="nav-appointments"
                  >
                    {t('nav.appointments')}
                  </Link>
                )}
                
                {user.role === 'clerk' && (
                  <Link 
                    href="/clerk" 
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isActive('/clerk') 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    data-testid="nav-clerk"
                  >
                    Clerk Interface
                  </Link>
                )}
                
                {user.role === 'admin' && (
                  <Link 
                    href="/admin" 
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isActive('/admin') 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
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
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-3 bg-white/50 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">
                      {(user.firstName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900" data-testid="text-username">
                      {user.firstName || user.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      data-testid="button-logout"
                      className="hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
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
