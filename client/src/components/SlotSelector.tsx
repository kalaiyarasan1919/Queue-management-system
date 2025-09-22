import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, AlertCircle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  available: boolean;
}

interface CapacityInfo {
  totalCapacity: number;
  booked: number;
  available: number;
  percentage: number;
}

interface DepartmentConfig {
  id: string;
  name: string;
  workingHours: {
    start: string;
    end: string;
    lunchStart?: string;
    lunchEnd?: string;
  };
  serviceTimeMinutes: number;
  maxDailyCapacity: number;
  slotsPerBooking: number;
}

interface SlotSelectorProps {
  departmentId: string;
  serviceId: string;
  selectedDate: string;
  onSlotSelect: (timeSlot: string) => void;
  selectedSlot?: string;
}

export function SlotSelector({ 
  departmentId, 
  serviceId, 
  selectedDate, 
  onSlotSelect, 
  selectedSlot 
}: SlotSelectorProps) {
  const [suggestedSlots, setSuggestedSlots] = useState<TimeSlot[]>([]);
  const [capacityInfo, setCapacityInfo] = useState<CapacityInfo | null>(null);
  const [departmentConfig, setDepartmentConfig] = useState<DepartmentConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (departmentId && selectedDate) {
      fetchSuggestedSlots();
    }
  }, [departmentId, selectedDate]);

  const fetchSuggestedSlots = async () => {
    if (!departmentId || !selectedDate) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('GET', `/api/departments/${departmentId}/suggested-slots/${selectedDate}`);
      setSuggestedSlots(response.suggestedSlots || []);
      setCapacityInfo(response.capacityInfo);
      setDepartmentConfig(response.departmentConfig);
    } catch (err) {
      console.error('Error fetching suggested slots:', err);
      setError('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const getSlotStatus = (slot: TimeSlot) => {
    if (!slot.available) return 'full';
    if (slot.booked > 0) return 'busy';
    return 'available';
  };

  const getSlotStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'busy': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'full': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSlotStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'busy': return <Clock className="w-4 h-4" />;
      case 'full': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading available slots...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button onClick={fetchSuggestedSlots} variant="outline" className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestedSlots.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>No slots available for the selected date</p>
            <p className="text-sm">Please try a different date</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Capacity Info */}
      {capacityInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Daily Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{capacityInfo.totalCapacity}</p>
                <p className="text-sm text-gray-600">Total Slots</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{capacityInfo.available}</p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{capacityInfo.booked}</p>
                <p className="text-sm text-gray-600">Booked</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{capacityInfo.percentage}%</p>
                <p className="text-sm text-gray-600">Filled</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${capacityInfo.percentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Config Info */}
      {departmentConfig && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Service Time: {departmentConfig.serviceTimeMinutes} minutes</span>
              <span>Working Hours: {departmentConfig.workingHours.start} - {departmentConfig.workingHours.end}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Preferred Time Slot</CardTitle>
          <p className="text-sm text-gray-600">
            Select one of the {suggestedSlots.length} available slots for your appointment
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedSlots.map((slot) => {
              const status = getSlotStatus(slot);
              const isSelected = selectedSlot === slot.startTime;
              
              return (
                <Button
                  key={slot.id}
                  variant={isSelected ? "default" : "outline"}
                  className={`h-auto p-4 flex flex-col items-center space-y-2 ${
                    !slot.available ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => slot.available && onSlotSelect(slot.startTime)}
                  disabled={!slot.available}
                >
                  <div className="flex items-center gap-2">
                    {getSlotStatusIcon(status)}
                    <span className="font-semibold">{slot.startTime} - {slot.endTime}</span>
                  </div>
                  
                  <Badge 
                    variant="secondary" 
                    className={getSlotStatusColor(status)}
                  >
                    {status === 'available' ? 'Available' : 
                     status === 'busy' ? 'Limited' : 'Full'}
                  </Badge>
                  
                  {slot.booked > 0 && (
                    <span className="text-xs text-gray-500">
                      {slot.booked} booked
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
          
          {suggestedSlots.length < 3 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Limited slots available. Book quickly to secure your preferred time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
