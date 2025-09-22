import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, Clock, TrendingUp, BarChart3, Edit, Trash2, QrCode, Plus, Users, Star, Shield, Zap } from "lucide-react";
import { EnhancedCard, StatCard, QueueItem } from "@/components/EnhancedCard";
import { LoadingSpinner, Skeleton } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { QRCodeModal } from "@/components/QRCodeModal";
import { SlotSelector } from "@/components/SlotSelector";
import { AISupport } from "@/components/AISupport";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const bookingSchema = z.object({
  departmentId: z.string().min(1, "Please select a department"),
  serviceId: z.string().min(1, "Please select a service"),
  appointmentDate: z.string().min(1, "Please select a date"),
  timeSlot: z.string().min(1, "Please select a time slot"),
  priority: z.enum(["normal", "senior", "disabled", "emergency"]).default("normal"),
  isPwd: z.boolean().default(false),
  pwdCertificateUrl: z.string().optional().nullable(),
  isSeniorCitizen: z.boolean().default(false),
  ageProofUrl: z.string().optional().nullable(),
  notificationEmail: z.string().email("Please enter a valid email address"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function CitizenDashboard() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { lastMessage } = useWebSocket();
  const queryClient = useQueryClient();

  // Get current user data
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: () => apiRequest('GET', '/api/auth/user'),
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      departmentId: "",
      serviceId: "",
      appointmentDate: "",
      timeSlot: "",
      priority: "normal",
      isPwd: false,
      pwdCertificateUrl: undefined,
    }
  });

  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['/api/departments'],
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/departments', selectedDepartment, 'services'],
    enabled: !!selectedDepartment,
  });

  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/api/appointments'],
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const appointmentData = {
        ...data,
        appointmentDate: new Date(data.appointmentDate).toISOString(),
      };
      await apiRequest('POST', '/api/appointments', appointmentData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: t('msg.appointment_booked'),
      });
      form.reset();
      setSelectedDepartment("");
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: t('msg.unauthorized'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: t('msg.booking_failed'),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      await apiRequest('DELETE', `/api/appointments/${appointmentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: t('msg.appointment_cancelled'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: t('msg.unauthorized'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    },
  });

  // Listen for real-time updates
  useEffect(() => {
    if (lastMessage?.type === 'APPOINTMENT_UPDATE' || lastMessage?.type === 'QUEUE_UPDATE') {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    }
  }, [lastMessage, queryClient]);

  const onSubmit = (data: BookingFormData) => {
    bookingMutation.mutate(data);
  };

  const handlePwdFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('certificate', file);
    const res = await fetch('/api/uploads/pwd-certificate', {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (res.ok && json.url) {
      form.setValue('pwdCertificateUrl', json.url);
    }
  };

  const handleAgeProofFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('certificate', file);
    const res = await fetch('/api/uploads/age-proof', {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (res.ok && json.url) {
      form.setValue('ageProofUrl', json.url);
    }
  };

  const handleShowQR = (appointment: any) => {
    setSelectedAppointment(appointment);
    setQrModalOpen(true);
  };

  const handleDelete = (appointmentId: string) => {
    deleteMutation.mutate(appointmentId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'serving': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Bookings</p>
                <p className="text-2xl font-bold text-primary" data-testid="stat-active-bookings">
                  {appointments?.filter((a: any) => ['confirmed', 'waiting', 'serving'].includes(a.status)).length || 0}
                </p>
              </div>
              <CalendarCheck className="text-primary text-2xl" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Next Appointment</p>
                <p className="text-lg font-semibold" data-testid="stat-next-appointment">
                  {appointments?.[0]?.appointmentDate 
                    ? new Date(appointments[0].appointmentDate).toLocaleDateString()
                    : 'None scheduled'
                  }
                </p>
              </div>
              <Clock className="text-secondary text-2xl" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg Wait Time</p>
                <p className="text-lg font-semibold text-accent" data-testid="stat-avg-wait">18 mins</p>
              </div>
              <Clock className="text-accent text-2xl" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Services Used</p>
                <p className="text-2xl font-bold" data-testid="stat-services-used">
                  {appointments?.filter((a: any) => a.status === 'completed').length || 0}
                </p>
              </div>
              <BarChart3 className="text-green-600 text-2xl" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">My QR Code</p>
                <p className="text-sm font-medium">Personal ID</p>
              </div>
              <QrCode 
                className="text-primary text-2xl cursor-pointer hover:text-primary/80" 
                onClick={() => {
                  // Show user's personal QR code
                  const userQR = `equeue://user/${user?.id}`;
                  setSelectedAppointment({ qrCode: userQR, tokenNumber: 'PERSONAL' });
                  setQrModalOpen(true);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="booking" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="booking">Book Appointment</TabsTrigger>
          <TabsTrigger value="appointments">My Appointments</TabsTrigger>
          <TabsTrigger value="queue">Live Queue</TabsTrigger>
          <TabsTrigger value="support">AI Support</TabsTrigger>
        </TabsList>

        <TabsContent value="booking" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="text-primary mr-2" />
                    {t('booking.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="departmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('booking.department')}</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedDepartment(value);
                              form.setValue('serviceId', '');
                            }}
                            value={field.value}
                            disabled={departmentsLoading}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-department">
                                <SelectValue placeholder="Select Department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments?.map((dept: any) => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('booking.service')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!selectedDepartment || servicesLoading}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-service">
                                <SelectValue placeholder="Select Service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {services?.map((service: any) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* PwD Section */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        id="isPwd"
                        type="checkbox"
                        checked={form.watch('isPwd')}
                        onChange={(e) => form.setValue('isPwd', e.target.checked)}
                      />
                      <Label htmlFor="isPwd">I am a person with disability (PwD)</Label>
                    </div>
                    {form.watch('isPwd') && (
                      <div className="space-y-2">
                        <Label htmlFor="pwd-cert">Upload disability certificate (PDF/image)</Label>
                        <Input id="pwd-cert" type="file" accept=".pdf,image/*" onChange={handlePwdFile} />
                        {form.watch('pwdCertificateUrl') && (
                          <p className="text-xs text-muted-foreground">Certificate uploaded.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Senior Citizen Support */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        id="isSeniorCitizen"
                        type="checkbox"
                        checked={form.watch('isSeniorCitizen')}
                        onChange={(e) => form.setValue('isSeniorCitizen', e.target.checked)}
                      />
                      <Label htmlFor="isSeniorCitizen">I am a senior citizen (60+ years)</Label>
                    </div>
                    {form.watch('isSeniorCitizen') && (
                      <div className="space-y-2">
                        <Label htmlFor="age-proof">Upload age proof (Aadhaar/Driving License)</Label>
                        <Input id="age-proof" type="file" accept=".pdf,image/*" onChange={handleAgeProofFile} />
                        {form.watch('ageProofUrl') && (
                          <p className="text-xs text-muted-foreground">Age proof uploaded.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="appointmentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('booking.date')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              min={new Date().toISOString().split('T')[0]}
                              data-testid="input-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timeSlot"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('booking.time')}</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Select a time slot below"
                              readOnly
                              data-testid="input-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('booking.priority')}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-1 md:grid-cols-3 gap-3"
                          >
                            <div className="flex items-center space-x-2 border border-border rounded-md p-3 hover:bg-muted cursor-pointer">
                              <RadioGroupItem value="normal" id="normal" />
                              <Label htmlFor="normal" className="cursor-pointer">{t('priority.normal')}</Label>
                            </div>
                            <div className="flex items-center space-x-2 border border-border rounded-md p-3 hover:bg-muted cursor-pointer">
                              <RadioGroupItem value="senior" id="senior" />
                              <Label htmlFor="senior" className="cursor-pointer">{t('priority.senior')}</Label>
                            </div>
                            <div className="flex items-center space-x-2 border border-border rounded-md p-3 hover:bg-muted cursor-pointer">
                              <RadioGroupItem value="disabled" id="disabled" />
                              <Label htmlFor="disabled" className="cursor-pointer">{t('priority.disabled')}</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notificationEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter email for notifications"
                            {...field}
                            data-testid="input-notification-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Slot Selector */}
                  {selectedDepartment && form.watch('appointmentDate') && (
                    <SlotSelector
                      departmentId={selectedDepartment}
                      serviceId={form.watch('serviceId')}
                      selectedDate={form.watch('appointmentDate')}
                      onSlotSelect={(timeSlot) => form.setValue('timeSlot', timeSlot)}
                      selectedSlot={form.watch('timeSlot')}
                    />
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={bookingMutation.isPending || !form.watch('timeSlot')}
                    data-testid="button-book-appointment"
                  >
                    {bookingMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Booking...
                      </div>
                    ) : (
                      <>
                        <CalendarCheck className="mr-2" size={16} />
                        {t('booking.submit')}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarCheck className="text-primary mr-2" />
            {t('nav.appointments')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : appointments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No appointments found. Book your first appointment above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments?.map((appointment: any) => (
                    <TableRow 
                      key={appointment.id} 
                      className={getPriorityColor(appointment.priority)}
                      data-testid={`row-appointment-${appointment.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {appointment.tokenNumber}
                          </div>
                          {appointment.isPwd && (
                            <span title="PwD priority" className="text-xl">♿</span>
                          )}
                          {appointment.isSeniorCitizen && (
                            <span title="Senior Citizen priority" className="text-xl">👴</span>
                          )}
                          <QrCode 
                            size={16} 
                            className="text-muted-foreground cursor-pointer hover:text-primary" 
                            onClick={() => handleShowQR(appointment)}
                            data-testid={`button-qr-${appointment.id}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>{appointment.department?.name}</TableCell>
                      <TableCell>{appointment.service?.name}</TableCell>
                      <TableCell>
                        {new Date(appointment.appointmentDate).toLocaleDateString()}, {appointment.timeSlot}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(appointment.status)}>
                          {t(`status.${appointment.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                            data-testid={`button-edit-${appointment.id}`}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(appointment.id)}
                            disabled={appointment.status === 'serving' || appointment.status === 'completed'}
                            data-testid={`button-delete-${appointment.id}`}
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="text-primary mr-2" />
                Live Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>Live queue status will be displayed here when available.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <AISupport />
          </Card>
        </TabsContent>
      </Tabs>

      {/* QR Code Modal */}
      {selectedAppointment && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          tokenNumber={selectedAppointment.tokenNumber}
          qrCode={selectedAppointment.qrCode}
        />
      )}
    </div>
  );
}
