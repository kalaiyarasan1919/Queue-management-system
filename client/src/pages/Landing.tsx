import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Shield, Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Landing() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Users className="text-primary text-6xl" />
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            eQueue 2.0
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Unified Digital Queue Management System for Government Services. 
            Book appointments, track queue status, and get real-time updates.
          </p>
          
          <div className="space-x-4">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Get Started
            </Button>
            
            <Button variant="outline" size="lg" data-testid="button-learn-more">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Why Choose eQueue 2.0?
          </h2>
          <p className="text-lg text-gray-600">
            Modern queue management designed for efficiency and convenience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader className="text-center">
              <Clock className="text-primary text-4xl mx-auto mb-4" />
              <CardTitle>Save Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                Book appointments online and avoid long waiting lines
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="text-primary text-4xl mx-auto mb-4" />
              <CardTitle>Priority Service</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                Special priority queues for senior citizens and differently-abled persons
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="text-primary text-4xl mx-auto mb-4" />
              <CardTitle>Real-time Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                Get live notifications about your queue position and estimated wait time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Languages className="text-primary text-4xl mx-auto mb-4" />
              <CardTitle>Multi-language</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                Available in English, Hindi, and Tamil for better accessibility
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Supported Government Services
            </h2>
            <p className="text-lg text-gray-600">
              Access multiple departments through a single platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "RTO Services", desc: "Driving license, vehicle registration, permits" },
              { name: "Income Certificate", desc: "Income certificate applications and renewals" },
              { name: "Aadhar Services", desc: "Aadhar updates, corrections, and new registrations" },
              { name: "Municipal Corporation", desc: "Birth/death certificates, property tax" },
              { name: "Passport Office", desc: "Passport applications and renewals" },
              { name: "Revenue Department", desc: "Land records, survey documents" }
            ].map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{service.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Skip the Line?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of citizens who have already simplified their government service experience
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-cta-login"
          >
            Start Booking Now
          </Button>
        </div>
      </div>
    </div>
  );
}
