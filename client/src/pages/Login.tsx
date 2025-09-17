import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, LogIn, Shield, Clock, Languages } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";

export default function Login() {
  const { t } = useLanguage();

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Selector */}
        <div className="flex justify-end mb-6">
          <LanguageSelector />
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Users className="text-primary-foreground text-2xl" />
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              eQueue 2.0
            </CardTitle>
            
            <p className="text-gray-600 text-sm">
              Digital Queue Management System
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Government Services Portal
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Clock className="text-primary" size={16} />
                <span>Book appointments online</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Shield className="text-primary" size={16} />
                <span>Priority queue for senior citizens</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Languages className="text-primary" size={16} />
                <span>Multi-language support</span>
              </div>
            </div>

            {/* Login Button */}
            <Button 
              onClick={handleLogin}
              className="w-full h-12 text-base font-medium"
              data-testid="button-login"
            >
              <LogIn className="mr-2" size={18} />
              Login with Replit
            </Button>

            {/* Info Text */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Secure authentication powered by Replit
            </p>
          </CardContent>
        </Card>

        {/* Support Departments */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-3">Supporting Government Departments:</p>
          <div className="flex justify-center space-x-4 text-xs text-gray-500">
            <span>RTO</span>
            <span>•</span>
            <span>Income Certificate</span>
            <span>•</span>
            <span>Aadhar</span>
            <span>•</span>
            <span>Municipal</span>
          </div>
        </div>
      </div>
    </div>
  );
}