import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Headphones, Play, Pause, X, Check, Coffee, Power, UserPlus, AlertTriangle, BarChart3, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { Counter, Appointment, TokenValidationResponse } from "@/types/clerk";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
 

export default function ClerkInterface() {
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [walkinOpen, setWalkinOpen] = useState(false);
  const [walkinServiceId, setWalkinServiceId] = useState<string>("");
  const [walkinPriority, setWalkinPriority] = useState<string>("emergency");
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get clerk's assigned counter
  const { data: counter } = useQuery<Counter>({
    queryKey: ['/api/counters/by-clerk', user?.id],
    enabled: !!user?.id,
  });

  const markNoShowMutation = useMutation({
    mutationFn: async () => {
      if (!currentAppointment?.id) return;
      return await apiRequest('POST', `/api/appointments/${currentAppointment.id}/no-show`);
    },
    onSuccess: () => {
      toast({
        title: 'Marked Absent',
        description: 'Token marked as no-show and queue updated',
      });
      setCurrentAppointment(null);
      queryClient.invalidateQueries({ queryKey: ['/api/departments', counter?.departmentId, 'queue'] });
    },
    onError: (error: any) => {
      if (error?.response?.status === 401) {
        toast({
          title: 'Unauthorized',
          description: 'You are logged out. Logging in again...',
          variant: 'destructive',
        });
        setTimeout(() => { window.location.href = '/api/login'; }, 500);
        return;
      }
      toast({ title: 'Error', description: 'Failed to mark absent', variant: 'destructive' });
    }
  });

  const createWalkinMutation = useMutation({
    mutationFn: async () => {
      if (!counter?.departmentId || !walkinServiceId) throw new Error('Missing inputs');
      return await apiRequest('POST', `/api/departments/${counter.departmentId}/walkin`, {
        serviceId: walkinServiceId,
        priority: walkinPriority,
      });
    },
    onSuccess: () => {
      toast({ title: 'Walk-in Added', description: 'Emergency token inserted' });
      setWalkinOpen(false);
      setWalkinServiceId("");
      setWalkinPriority('emergency');
      queryClient.invalidateQueries({ queryKey: ['/api/departments', counter?.departmentId, 'queue'] });
    },
    onError: (error: any) => {
      if (error?.response?.status === 401) {
        toast({ title: 'Unauthorized', description: 'You are logged out. Logging in again...', variant: 'destructive' });
        setTimeout(() => { window.location.href = '/api/login'; }, 500);
        return;
      }
      toast({ title: 'Error', description: 'Failed to add walk-in', variant: 'destructive' });
    }
  });

  // Get current queue for the department
  const { data: queue, isLoading: queueLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/departments', counter?.departmentId, 'queue'],
    enabled: !!counter?.departmentId,
  });

  // Load services for the counter's department (for walk-in)
  const { data: services } = useQuery<any[]>({
    queryKey: ['/api/departments', counter?.departmentId, 'services'],
    enabled: !!counter?.departmentId,
  });

  const callNextMutation = useMutation({
    mutationFn: async () => {
      if (!counter?.id) throw new Error('Counter not assigned');
      return await apiRequest<Appointment>('POST', `/api/counters/${counter.id}/call-next`);
    },
    onSuccess: (response) => {
      setCurrentAppointment(response);
      toast({
        title: "Success",
        description: "Next customer called successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments', counter?.departmentId, 'queue'] });
    },
    onError: (error: any) => {
      if (error?.response?.status === 401) {
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
      toast({
        title: "Error",
        description: "Failed to call next customer",
        variant: "destructive",
      });
    },
  });

  const completeServiceMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PATCH', `/api/appointments/${currentAppointment?.id}`, {
        status: 'completed',
        actualEndTime: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Service Completed",
        description: "Customer service completed successfully",
      });
      setCurrentAppointment(null);
      queryClient.invalidateQueries({ queryKey: ['/api/departments', counter?.departmentId, 'queue'] });
    },
    onError: (error: any) => {
      if (error?.response?.status === 401) {
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
      toast({
        title: "Error",
        description: "Failed to complete service",
        variant: "destructive",
      });
    },
  });

  const updateCounterStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest('PATCH', `/api/counters/${counter?.id}/status`, { status });
    },
    onSuccess: (data) => {
      toast({
        title: "Status Updated",
        description: `Counter status changed to ${data.status}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/counters', user?.id] });
    },
    onError: (error: any) => {
      if (error?.response?.status === 401) {
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
      toast({
        title: "Error",
        description: "Failed to update counter status",
        variant: "destructive",
      });
    },
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage?.type === 'QUEUE_UPDATE') {
      setCurrentAppointment(lastMessage.data.currentServing);
      queryClient.invalidateQueries({ queryKey: ['/api/departments', lastMessage.data.departmentId, 'queue'] });
    }
  }, [lastMessage, queryClient]);

  // QR scanner handler
  const handleTokenScan = async (tokenId: string): Promise<{ valid: boolean; appointment?: Appointment }> => {
    try {
      const response = await apiRequest<TokenValidationResponse>('POST', `/api/tokens/validate`, { tokenId });
      if (response.valid && response.appointment) {
        setCurrentAppointment(response.appointment);
        toast({
          title: "Token Valid",
          description: `Token ${tokenId} is valid and ready for service`,
        });
      }
      return { valid: response.valid, appointment: response.appointment };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate token",
        variant: "destructive",
      });
      return { valid: false };
    }
  };

  const handleCallNext = () => {
    callNextMutation.mutate();
  };

  const handleCompleteService = () => {
    completeServiceMutation.mutate();
  };

  const handleHold = () => {
    // Implementation for putting customer on hold
    toast({
      title: "Feature Coming Soon",
      description: "Hold functionality will be available soon",
    });
  };

  const handleMarkAbsent = () => {
    markNoShowMutation.mutate();
  };

  const getCounterStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'busy': return 'bg-yellow-500 text-white';
      case 'break': return 'bg-orange-500 text-white';
      case 'offline': return 'bg-gray-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'border-l-4 border-red-500 bg-red-50';
      case 'senior': 
      case 'disabled': return 'border-l-4 border-orange-500 bg-orange-50';
      default: return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  if (!counter) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
        <p className="text-lg font-medium">No counter assigned</p>
        <p className="text-muted-foreground">Please contact your administrator to assign a counter.</p>
      </div>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="mr-2" />
              Token Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QRCodeScanner onScan={handleTokenScan} />
          </CardContent>
        </Card>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Headphones className="text-secondary mr-2" />
              Counter {counter.number} - {counter.department?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentAppointment ? (
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-800">Now Serving</h3>
                  <Badge className="bg-green-500 text-white">Active</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-green-700 mb-1">Token Number</p>
                    <p className="text-2xl font-bold text-green-800" data-testid="text-current-token">
                      {currentAppointment.tokenNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 mb-1">Service Type</p>
                    <p className="font-medium text-green-800" data-testid="text-current-service">
                      {currentAppointment.service?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 mb-1">Citizen Name</p>
                    <p className="font-medium text-green-800" data-testid="text-citizen-name">
                      {currentAppointment.citizen?.firstName} {currentAppointment.citizen?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 mb-1">Start Time</p>
                    <p className="font-medium text-green-800" data-testid="text-start-time">
                      {currentAppointment.actualStartTime 
                        ? new Date(currentAppointment.actualStartTime).toLocaleTimeString()
                        : 'Not started'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    onClick={handleCompleteService}
                    disabled={completeServiceMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-complete-service"
                  >
                    <Check className="mr-2" size={16} />
                    Complete Service
                  </Button>
                  <Button 
                    onClick={handleHold}
                    variant="outline"
                    className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                    data-testid="button-hold"
                  >
                    <Pause className="mr-2" size={16} />
                    Put on Hold
                  </Button>
                  <Button 
                    onClick={handleMarkAbsent}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                    data-testid="button-mark-absent"
                  >
                    <X className="mr-2" size={16} />
                    Mark Absent
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-gray-400 mb-4">
                  <UserPlus size={48} className="mx-auto" />
                </div>
                <p className="text-lg font-medium text-gray-600 mb-4">No customer being served</p>
                <Button 
                  onClick={handleCallNext}
                  disabled={callNextMutation.isPending || queueLoading}
                  data-testid="button-call-next"
                >
                  {callNextMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Calling...
                    </div>
                  ) : (
                    <>
                      <Play className="mr-2" size={16} />
                      Call Next Customer
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue Management */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {queueLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : queue?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No customers in queue
              </div>
            ) : (
              <div className="space-y-3">
                {queue?.slice(0, 5).map((appointment: Appointment, index: number) => (
                  <div 
                    key={appointment.id} 
                    className={`flex items-center justify-between p-3 border border-border rounded-md ${getPriorityColor(appointment.priority)}`}
                    data-testid={`queue-item-${appointment.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                        {appointment.tokenNumber}
                      </div>
                      <div>
                        <p className="font-medium">
                          {appointment.citizen?.firstName} {appointment.citizen?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.service?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {appointment.priority !== 'normal' && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          {appointment.priority === 'senior' ? 'Senior Citizen' : 
                           appointment.priority === 'disabled' ? 'Differently Abled' : 
                           appointment.priority}
                        </Badge>
                      )}
                      {index === 0 && !currentAppointment && (
                        <Button 
                          size="sm"
                          onClick={handleCallNext}
                          disabled={callNextMutation.isPending}
                          data-testid={`button-call-${appointment.id}`}
                        >
                          Call Next
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clerk Controls & Stats */}
      <div className="space-y-6">
        {/* Counter Status */}
        <Card>
          <CardHeader>
            <CardTitle>Counter Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge className={getCounterStatusColor(counter.status)} data-testid="badge-counter-status">
                  {counter.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Services Today</span>
                <span className="font-bold" data-testid="text-services-count">18</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Service Time</span>
                <span className="font-bold" data-testid="text-avg-service-time">12 mins</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Queue Length</span>
                <span className="font-bold" data-testid="text-queue-length">
                  {queue?.length || 0}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Button 
                variant="outline"
                className="w-full border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                onClick={() => updateCounterStatusMutation.mutate('break')}
                disabled={updateCounterStatusMutation.isPending}
                data-testid="button-take-break"
              >
                <Coffee className="mr-2" size={16} />
                Take Break
              </Button>
              <Button 
                variant="outline"
                className="w-full border-red-600 text-red-600 hover:bg-red-50"
                onClick={() => updateCounterStatusMutation.mutate('offline')}
                disabled={updateCounterStatusMutation.isPending}
                data-testid="button-go-offline"
              >
                <Power className="mr-2" size={16} />
                Go Offline
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline"
                className="w-full justify-start"
                onClick={() => setWalkinOpen(true)}
                data-testid="button-add-walkin"
              >
                <UserPlus className="mr-2" size={16} />
                Add Walk-in Customer
              </Button>

              <Button 
                variant="outline"
                className="w-full justify-start"
                data-testid="button-report-issue"
              >
                <AlertTriangle className="mr-2" size={16} />
                Report Issue
              </Button>

              <Button 
                variant="outline"
                className="w-full justify-start"
                data-testid="button-view-report"
              >
                <BarChart3 className="mr-2" size={16} />
                View Today's Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    {/* Walk-in Modal */}
    <Dialog open={walkinOpen} onOpenChange={setWalkinOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Walk-in</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Service</label>
            <select
              className="w-full border rounded p-2"
              value={walkinServiceId}
              onChange={(e) => setWalkinServiceId(e.target.value)}
              data-testid="select-walkin-service"
            >
              <option value="">Select Service</option>
              {services?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Priority</label>
            <select
              className="w-full border rounded p-2"
              value={walkinPriority}
              onChange={(e) => setWalkinPriority(e.target.value)}
              data-testid="select-walkin-priority"
            >
              <option value="emergency">Emergency</option>
              <option value="senior">Senior</option>
              <option value="disabled">Disabled</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => createWalkinMutation.mutate()} disabled={createWalkinMutation.isPending}>
              {createWalkinMutation.isPending ? 'Adding...' : 'Add Walk-in'}
            </Button>
            <Button variant="outline" onClick={() => setWalkinOpen(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
