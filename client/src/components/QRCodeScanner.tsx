import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { QrCode, Check, X, User, Building, Clock, Calendar } from "lucide-react";
import { Appointment } from "@/types/clerk";

export function QRCodeScanner({ onScan }: { onScan: (tokenId: string) => Promise<{ valid: boolean; appointment?: Appointment }> }) {
  const { t } = useLanguage();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);

  const handleScan = async (result: string) => {
    if (result) {
      setScanResult(result);
      setIsLoading(true);
      try {
        const response = await onScan(result);
        setIsValid(response.valid);
        setAppointment(response.appointment || null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setIsValid(null);
    setAppointment(null);
    // Reinitialize scanner here
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-full max-w-md h-64 bg-black rounded-md overflow-hidden">
          {/* QR Scanner will be rendered here */}
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover"
            playsInline
          />
          
          {scanResult && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="text-center p-4 bg-white rounded-lg max-w-md max-h-96 overflow-y-auto">
                {isValid === true ? (
                  <div className="text-green-600 flex flex-col items-center">
                    <Check size={48} className="mb-2" />
                    <p className="text-xl font-bold">{t('scanner.valid')}</p>
                    <p className="text-sm mt-2 mb-4">Token: {scanResult}</p>
                    
                    {appointment && (
                      <div className="w-full text-left text-black space-y-3">
                        <div className="border-t pt-3">
                          <h3 className="font-semibold text-lg mb-2 flex items-center">
                            <User className="mr-2" size={20} />
                            User Details
                          </h3>
                          <div className="space-y-1 text-sm">
                            <p><strong>Name:</strong> {appointment.citizen?.firstName} {appointment.citizen?.lastName}</p>
                            <p><strong>Email:</strong> {appointment.citizen?.email}</p>
                            <p><strong>Role:</strong> {appointment.citizen?.role}</p>
                          </div>
                        </div>
                        
                        <div className="border-t pt-3">
                          <h3 className="font-semibold text-lg mb-2 flex items-center">
                            <Building className="mr-2" size={20} />
                            Department & Service
                          </h3>
                          <div className="space-y-1 text-sm">
                            <p><strong>Department:</strong> {appointment.department?.name}</p>
                            <p><strong>Service:</strong> {appointment.service?.name}</p>
                            <p><strong>Service Description:</strong> {appointment.service?.description || 'N/A'}</p>
                            <p><strong>Estimated Time:</strong> {appointment.service?.estimatedTime} minutes</p>
                          </div>
                        </div>
                        
                        <div className="border-t pt-3">
                          <h3 className="font-semibold text-lg mb-2 flex items-center">
                            <Calendar className="mr-2" size={20} />
                            Appointment Details
                          </h3>
                          <div className="space-y-1 text-sm">
                            <p><strong>Date:</strong> {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                            <p><strong>Time Slot:</strong> {appointment.timeSlot}</p>
                            <p><strong>Priority:</strong> {appointment.priority}</p>
                            <p><strong>Status:</strong> {appointment.status}</p>
                            {appointment.queuePosition && (
                              <p><strong>Queue Position:</strong> {appointment.queuePosition}</p>
                            )}
                            {appointment.estimatedWaitTime && (
                              <p><strong>Estimated Wait:</strong> {appointment.estimatedWaitTime} minutes</p>
                            )}
                          </div>
                        </div>
                        
                        {(appointment.isPwd || appointment.isSeniorCitizen) && (
                          <div className="border-t pt-3">
                            <h3 className="font-semibold text-lg mb-2">Special Requirements</h3>
                            <div className="space-y-1 text-sm">
                              {appointment.isPwd && <p className="text-blue-600">✓ Person with Disability</p>}
                              {appointment.isSeniorCitizen && <p className="text-blue-600">✓ Senior Citizen</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : isValid === false ? (
                  <div className="text-red-600 flex flex-col items-center">
                    <X size={48} className="mb-2" />
                    <p className="text-xl font-bold">{t('scanner.invalid')}</p>
                    <p className="text-sm mt-2">{scanResult}</p>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    <p className="text-xl font-bold">{t('scanner.processing')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            onClick={resetScanner}
            disabled={!scanResult}
          >
            {t('scanner.rescan')}
          </Button>
          
          <Button 
            variant="default" 
            onClick={() => {
              // Manual entry fallback
              const tokenId = prompt(t('scanner.enter_token'));
              if (tokenId) handleScan(tokenId);
            }}
          >
            <QrCode className="mr-2" size={16} />
            {t('scanner.manual_entry')}
          </Button>
        </div>
      </div>
    </div>
  );
}
